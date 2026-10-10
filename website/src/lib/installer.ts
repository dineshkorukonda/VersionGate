export const INSTALLER_URL = "https://raw.githubusercontent.com/dineshkorukonda/VersionGate/main/install.sh";
export const DOWNLOAD_INSTALLER_CMD = `curl -fsSL ${INSTALLER_URL} -o /tmp/versiongate-install.sh`;
export const INSTALL_CMD = `${DOWNLOAD_INSTALLER_CMD} && sudo bash /tmp/versiongate-install.sh`;
export const DOMAIN_INSTALL_CMD = `${DOWNLOAD_INSTALLER_CMD} && sudo env DOMAIN=vg.example.com bash /tmp/versiongate-install.sh`;
