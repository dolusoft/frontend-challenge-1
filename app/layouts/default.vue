<template>
  <div class="min-h-screen bg-canvas">
    <!-- Full-width navbar -->
    <AppNavbar />

    <!-- Sidebar: floats below navbar -->
    <AppSidebar />

    <!-- Content area — offset from sidebar, below navbar -->
    <div class="ml-[292px] pr-4 pt-5 pb-6 min-h-[calc(100vh-56px)]">
      <slot />
    </div>
  </div>
</template>
