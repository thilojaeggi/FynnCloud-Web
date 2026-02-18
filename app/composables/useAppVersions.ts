export const useAppVersions = () => {
  const runtimeConfig = useRuntimeConfig();
  const frontendVersion = runtimeConfig.public.appVersion;

  const { appVersion: backendVersion } = useBackEndConfig();

  return {
    frontendVersion,
    backendVersion,
  };
};
