import ExpoModulesCore
import MediaPipeTasksVision
import UIKit

public class PoseExtractorModule: Module {
  private var poseLandmarker: PoseLandmarker?
  
  public func definition() -> ModuleDefinition {
    Name("PoseExtractor")
    
    // Initialize the pose landmarker with model from bundle
    AsyncFunction("initialize") { () -> Void in
      guard let modelPath = Bundle.main.path(forResource: "pose_landmarker", ofType: "task") else {
        throw NSError(
          domain: "PoseExtractorModule",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Model file 'pose_landmarker.task' not found in app bundle"]
        )
      }
      
      let options = PoseLandmarkerOptions()
      options.baseOptions.modelAssetPath = modelPath
      options.runningMode = .image
      options.minPoseDetectionConfidence = 0.5
      options.minPosePresenceConfidence = 0.5
      options.minTrackingConfidence = 0.5
      options.numPoses = 1
      
      self.poseLandmarker = try PoseLandmarker(options: options)
    }
    
    // Detect pose from image file URI
    // Returns array of 33 landmarks: [{ x, y, z, visibility }, ...]
    AsyncFunction("detectPoseFromImage") { (imageUri: String) -> [[String: Any]] in
      guard let poseLandmarker = self.poseLandmarker else {
        throw NSError(
          domain: "PoseExtractorModule",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "Pose landmarker not initialized. Call initialize() first."]
        )
      }
      
      // Handle file:// URIs
      let cleanUri = imageUri.replacingOccurrences(of: "file://", with: "")
      guard let url = URL(fileURLWithPath: cleanUri) as URL?,
            let imageData = try? Data(contentsOf: url),
            let uiImage = UIImage(data: imageData) else {
        throw NSError(
          domain: "PoseExtractorModule",
          code: 3,
          userInfo: [NSLocalizedDescriptionKey: "Failed to load image from URI: \(imageUri)"]
        )
      }
      
      // Convert UIImage to MPImage
      let mpImage = try MPImage(uiImage: uiImage)
      
      // Run pose detection
      let result = try poseLandmarker.detect(image: mpImage)
      
      // Extract first pose (we only detect 1 pose)
      guard let landmarks = result.landmarks.first else {
        throw NSError(
          domain: "PoseExtractorModule",
          code: 4,
          userInfo: [NSLocalizedDescriptionKey: "No pose detected in image"]
        )
      }
      
      // Convert to JS-compatible format (33 landmarks)
      let landmarksArray = landmarks.map { landmark -> [String: Any] in
        return [
          "x": landmark.x,
          "y": landmark.y,
          "z": landmark.z,
          "visibility": landmark.visibility?.floatValue ?? 0.0
        ]
      }
      
      return landmarksArray
    }
    
    // Clean up resources
    Function("dispose") { () -> Void in
      self.poseLandmarker = nil
    }
  }
}
