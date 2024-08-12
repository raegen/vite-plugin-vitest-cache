export const variable = JSON.stringify(
  import.meta.glob<{ default: string }>('./variables/*.ts', {
    eager: true,
  }),
);
