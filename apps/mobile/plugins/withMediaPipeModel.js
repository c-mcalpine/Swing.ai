const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to copy MediaPipe model file to iOS app bundle
 */
function withMediaPipeModel(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const modelSourcePath = path.join(config.modRequest.projectRoot, 'assets', 'models', 'pose_landmarker.task');
      const modelDestPath = path.join(config.modRequest.platformProjectRoot, 'mobile', 'pose_landmarker.task');
      
      // Copy model file to iOS project
      if (fs.existsSync(modelSourcePath)) {
        fs.copyFileSync(modelSourcePath, modelDestPath);
        console.log('✅ Copied pose_landmarker.task to iOS bundle');
      } else {
        console.warn('⚠️  pose_landmarker.task not found at', modelSourcePath);
      }
      
      return config;
    },
  ]);
}

module.exports = withMediaPipeModel;
