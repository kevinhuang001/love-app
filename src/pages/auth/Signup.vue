<template>
  <VaForm ref="form" @submit.prevent="submit">
    <h1 class="font-semibold text-4xl mb-4">Sign up</h1>
    <p class="text-base mb-4 leading-5">
      Have an account?
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">Login</RouterLink>
    </p>
    <VaInput
      v-model="formData.username"
      :rules="[(v) => !!v || 'Username field is required']"
      class="mb-4"
      label="Username"
      type="text"
    />
    <VaInput
      v-model="formData.displayName"
      :rules="[(v) => !!v || 'Display Name is required']"
      class="mb-4"
      label="Display Name"
      type="text"
    />
    <VaDateInput v-model="formData.birthday" class="mb-4" label="Birthday (Optional)" clearable />
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        ref="password1"
        v-model="formData.password"
        :rules="passwordRules"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Password"
        messages="Password should be 8+ characters: letters, numbers, and special characters."
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
      <VaInput
        ref="password2"
        v-model="formData.repeatPassword"
        :rules="[
          (v) => !!v || 'Repeat Password field is required',
          (v) => v === formData.password || 'Passwords don\'t match',
        ]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Repeat Password"
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
    </VaValue>

    <div class="mt-4 flex flex-col sm:flex-row items-center sm:items-center gap-2">
      <VaInput
        v-model="formData.captcha"
        :rules="[(v) => !!v || 'Captcha is required']"
        label="Captcha"
        class="w-full sm:flex-grow"
      />
      <div
        class="cursor-pointer border rounded overflow-hidden h-[44px] min-w-[120px] flex items-center justify-center bg-gray-50 self-center sm:self-auto mt-2 sm:mt-0"
        title="Click to refresh"
        @click="refreshCaptcha"
      >
        <div
          v-if="captchaSvg"
          class="w-full h-full flex items-center justify-center scale-110"
          v-html="captchaSvg"
        ></div>
        <div v-else class="px-4 py-2 text-sm text-gray-400">Loading...</div>
      </div>
    </div>

    <div class="flex justify-center mt-4">
      <VaButton class="w-full" :loading="isLoading" @click="submit"> Create account</VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { useUserStore } from '../../stores/user-store'
import { getCaptchaUrl } from '../../services/api'

const { validate } = useForm('form')
const { push } = useRouter()
const { init } = useToast()
const store = useUserStore()
const isLoading = ref(false)
const captchaSvg = ref('')

const formData = reactive({
  username: '',
  displayName: '',
  password: '',
  repeatPassword: '',
  birthday: undefined as Date | undefined,
  captcha: '',
})

const refreshCaptcha = async () => {
  try {
    const response = await fetch(getCaptchaUrl(), { credentials: 'include' })
    if (response.ok) {
      captchaSvg.value = await response.text()
    }
  } catch (e) {
    console.error('Failed to load captcha', e)
  }
}

onMounted(() => {
  refreshCaptcha()
})

const formatDate = (date: Date | undefined) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const submit = async () => {
  if (isLoading.value) return
  if (validate()) {
    isLoading.value = true
    const result = await store.register(
      formData.username,
      formData.password,
      formData.displayName,
      formatDate(formData.birthday),
      formData.captcha,
    )
    isLoading.value = false
    if (result.success) {
      init({
        message: "You've successfully signed up",
        color: 'success',
      })
      push({ name: 'login' })
    } else {
      init({
        message: result.error || 'Signup failed',
        color: 'danger',
      })
      refreshCaptcha()
      formData.captcha = ''
    }
  }
}

const passwordRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || 'Password field is required',
  (v) => (v && v.length >= 8) || 'Password must be at least 8 characters long',
  (v) => (v && /[A-Za-z]/.test(v)) || 'Password must contain at least one letter',
  (v) => (v && /\d/.test(v)) || 'Password must contain at least one number',
  (v) => (v && /[!@#$%^&*(),.?":{}|<>]/.test(v)) || 'Password must contain at least one special character',
]
</script>
