
export const script = (
   attribute: string,
   storageKey: string,
   defaultTheme: any,
   forcedTheme: any,
   themes: any,
   value: any,
   enableSystem: any,
   enableColorScheme: any
) => {
   const body = document.body
   const systemThemes = ['light', 'dark']
   const isClass = attribute === 'class'
   const classes = isClass && value ? themes.map((t: any) => value[t] || t) : themes
   // theme color
   function updateDOM(theme: string) {
      if (isClass) {
         body.classList.remove(...classes)
         body.classList.add(theme)
      } else {
         body.setAttribute(attribute, theme)
      }
      setColorScheme(theme)
   }

   function setColorScheme(theme: string) {
      if (enableColorScheme && systemThemes.includes(theme)) {
         body.style.colorScheme = theme
      }
   }

   function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
   }
   // sidebar
   function updateCollapsed() {
      // const windowWidth = window.innerWidth
      const menuCollapsed = localStorage.getItem('collapsed') === 'true'

      body.classList.remove('sidebar-collapsed')

      // if (menuCollapsed === 'collapsed' && windowWidth >= 1024) {
      //    body.classList.add('sidebar-collapsed')
      // }
      // if (menuCollapsed === 'collapsed' && windowWidth < 1024) {
      //    body.classList.add('overlay-sidebar')
      // }

      if (menuCollapsed) {
         body.classList.add('sidebar-collapsed')
      }
   }
   updateCollapsed()

   if (forcedTheme) {
      updateDOM(forcedTheme)
   } else {
      try {
         const themeName = localStorage.getItem(storageKey) || defaultTheme
         const isSystem = enableSystem && themeName === 'system'
         const theme = isSystem ? getSystemTheme() : themeName
         updateDOM(theme)
      } catch (e) {
         //
      }
   }
}
