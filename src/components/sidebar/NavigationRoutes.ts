export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'love-dashboard',
      displayName: 'Dashboard',
      meta: {
        icon: 'dashboard',
      },
    },
    {
      name: 'love-timeline',
      displayName: 'Our Journey',
      meta: {
        icon: 'timeline',
      },
    },
    {
      name: 'love-messages',
      displayName: 'Love Notes',
      meta: {
        icon: 'favorite',
      },
    },
    {
      name: 'love-settings',
      displayName: 'Settings',
      meta: {
        icon: 'settings',
      },
    },
  ] as INavigationRoute[],
}
