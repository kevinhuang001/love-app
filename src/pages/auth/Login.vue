<template>
  <VaForm ref="form" @submit.prevent="submit">
    <h1 class="font-semibold text-4xl mb-4">Log in</h1>
    <p class="text-base mb-4 leading-5">
      New to Vuestic?
      <RouterLink :to="{ name: 'signup' }" class="font-semibold text-primary">Sign up</RouterLink>
    </p>
    <VaInput v-model="formData.username" :rules="[validators.required]" class="mb-4" label="Username" type="text" />
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="formData.password"
        :rules="[validators.required]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Password"
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

    <div class="auth-layout__options flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <VaCheckbox v-model="formData.keepLoggedIn" class="mb-2 sm:mb-0" label="Keep me signed in on this device" />
      <RouterLink :to="{ name: 'recover-password' }" class="mt-2 sm:mt-0 sm:ml-1 font-semibold text-primary">
        Forgot password?
      </RouterLink>
    </div>

    <!-- Captcha Section -->
    <div class="mt-4 flex flex-col sm:flex-row items-center sm:items-center gap-2">
      <VaInput v-model="formData.captcha" :rules="[validators.required]" label="Captcha" class="w-full sm:flex-grow" />
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
      <VaButton class="w-full" @click="submit"> Login</VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { validators } from '../../services/utils'
import { useUserStore } from '../../stores/user-store'
import { getCaptchaUrl } from '../../services/api'

const { validate } = useForm('form')
const { push } = useRouter()
const { init } = useToast()
const store = useUserStore()

const captchaSvg = ref('')
const formData = reactive({
  username: '',
  password: '',
  captcha: '',
  keepLoggedIn: false,
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

const submit = async () => {
  if (validate()) {
    const result = await store.login(formData.username, formData.password, formData.captcha)
    if (result.success) {
      init({ message: "You've successfully logged in", color: 'success' })
      push({ name: 'love-dashboard' })
    } else {
      init({ message: result.error || 'Login failed', color: 'danger' })
      refreshCaptcha()
      formData.captcha = ''
    }
  }
}
</script>
