const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to bundle MediaPipe model file into iOS app
 * 
 * This plugin:
 * 1. Copies pose_landmarker.task to the iOS project directory
 * 2. Adds it to the Xcode project's "Copy Bundle Resources" build phase
 */
function withMediaPipeModel(config) {
  // Step 1: Copy file to iOS directory
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const modelSourcePath = path.join(
        config.modRequest.projectRoot,
        'assets',
        'models',
        'pose_landmarker.task'
      );
      const modelDestPath = path.join(
        config.modRequest.platformProjectRoot,
        'pose_landmarker.task'
      );

      if (fs.existsSync(modelSourcePath)) {
        fs.copyFileSync(modelSourcePath, modelDestPath);
        console.log('✅ Copied pose_landmarker.task to iOS project');
      } else {
        console.warn('⚠️  pose_landmarker.task not found at', modelSourcePath);
      }

      return config;
    },
  ]);

  // Step 2: Add file to Xcode project resources
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const modelFileName = 'pose_landmarker.task';

    // Add file reference to project
    const fileRef = xcodeProject.addResourceFile(
      modelFileName,
      { target: xcodeProject.getFirstTarget().uuid },
      xcodeProject.getFirstProject().uuid
    );

    if (fileRef) {
      console.log('✅ Added pose_landmarker.task to Xcode project resources');
    }

    return config;
  });

  return config;
}

module.exports = withMediaPipeModel;
