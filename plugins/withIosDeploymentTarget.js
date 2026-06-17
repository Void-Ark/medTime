const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// A plugin to set the deployment target in the Xcode project
const withIosDeploymentTargetProject = (config, deploymentTarget) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key] === 'object' && configurations[key].buildSettings) {
        const buildSettings = configurations[key].buildSettings;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      }
    }
    return config;
  });
};

// A plugin to inject post_install fixes into the Podfile
const withIosDeploymentTargetPodfile = (config, deploymentTarget) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = await fs.promises.readFile(podfilePath, 'utf8');

      // Check if we already injected our changes
      if (!podfileContent.includes('Force all pods to meet the minimum deployment target')) {
        const patch = `
    # Force all pods to meet the minimum deployment target (${deploymentTarget})
    # and C++20 standard (fmt requires consteval which is C++20)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < ${deploymentTarget}
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
        end
        build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      end
    end

    # Force all user project targets to meet the minimum deployment target (${deploymentTarget})
    user_project = Xcodeproj::Project.open("medtime.xcodeproj")
    user_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < ${deploymentTarget}
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
        end
      end
    end
    user_project.save

    # fmt 11.x marks consteval as working for Apple Clang >= 14, but it's still
    # broken for FMT_STRING. Raise the threshold to 99999999 so all Apple Clang
    # versions use FMT_USE_CONSTEVAL=0 (the safe runtime fallback).
    fmt_base_h = "\#{installer.sandbox.root}/fmt/include/fmt/base.h"
    if File.exist?(fmt_base_h)
      FileUtils.chmod('u+w', fmt_base_h)
      content = File.read(fmt_base_h)
      patched = content.gsub('__apple_build_version__ < 14000029L', '__apple_build_version__ < 99999999L')
      File.write(fmt_base_h, patched)
    end
`;

        // Find the post_install block and insert our code
        const targetString = 'post_install do |installer|';
        if (podfileContent.includes(targetString)) {
          podfileContent = podfileContent.replace(
            targetString,
            `${targetString}${patch}`
          );
        }

        // Also change platform version line if it exists
        podfileContent = podfileContent.replace(
          /platform :ios, .*/,
          `platform :ios, '${deploymentTarget}'`
        );

        await fs.promises.writeFile(podfilePath, podfileContent, 'utf8');
      }

      return config;
    },
  ]);
};

module.exports = (config, options = {}) => {
  const deploymentTarget = options.deploymentTarget || '15.5';
  config = withIosDeploymentTargetProject(config, deploymentTarget);
  config = withIosDeploymentTargetPodfile(config, deploymentTarget);
  return config;
};
