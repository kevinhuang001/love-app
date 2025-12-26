<template>
  <div class="flex flex-col justify-between h-screen items-center bg-[var(--va-background-secondary)]">
    <RouterLink to="/" class="my-8 text-primary font-bold text-xl"> Love App </RouterLink>

    <div class="flex flex-col items-center gap-6 px-4 my-8">
      <VaIcon name="sentiment_dissatisfied" size="80px" color="primary" />
      <h1 class="va-h1 text-center sm:text-5xl text-4xl">Page not found</h1>

      <p class="text-center">
        The page you are looking for might have been removed had its name changed or is temporarily unavailable.
      </p>

      <div class="flex flex-col sm:flex-row gap-4">
        <VaButton to="/">Go to homepage</VaButton>
      </div>
    </div>

    <div />
  </div>
</template>

<script lang="ts" setup></script>
