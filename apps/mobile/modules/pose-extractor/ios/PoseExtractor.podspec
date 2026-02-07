Pod::Spec.new do |s|
  s.name           = 'PoseExtractor'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS MediaPipe Pose Landmarker for React Native'
  s.description    = 'Exposes MediaPipe Tasks Vision Pose Landmarker to React Native via Expo Modules'
  s.author         = 'Swing.ai'
  s.homepage       = 'https://swing.ai'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '~> 0.10.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
