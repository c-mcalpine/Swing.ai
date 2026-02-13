const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to bundle MediaPipe model file into iOS app
 * 
 * Copies pose_landmarker.task to the iOS project root directory.
 * Then manually add it to Xcode's Copy Bundle Resources.
 */
function withMediaPipeModel(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const modelSourcePath = path.join(
        config.modRequest.projectRoot,
        'assets',
        'models',
        'pose_landmarker.task'
      );
      
      // Copy to iOS project root
      const modelDestPath = path.join(
        config.modRequest.platformProjectRoot,
        'pose_landmarker.task'
      );

      if (fs.existsSync(modelSourcePath)) {
        fs.copyFileSync(modelSourcePath, modelDestPath);
        console.log('✅ Copied pose_landmarker.task to iOS project');
        console.log('📝 Next: Open Xcode and add pose_landmarker.task to "Copy Bundle Resources"');
      } else {
        console.error('❌ pose_landmarker.task not found at', modelSourcePath);
        throw new Error('Model file not found. Download it from MediaPipe releases.');
      }

      return config;
    },
  ]);
}

module.exports = withMediaPipeModel;
