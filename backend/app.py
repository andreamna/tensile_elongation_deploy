import os
import numpy as np
import cv2
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://tensileelongationdeploy.vercel.app"])

PHASE_MAP_IMG_FOLDER = "phase_map_img"
KAM_IMG_FOLDER = "KAM_img"
MORPHED_OUTPUT_FOLDER = "morphed_outputs"

os.makedirs(MORPHED_OUTPUT_FOLDER, exist_ok=True)

predefined_percentages = [5, 7.5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

def find_closest_images(percentage, image_type):
    if percentage in predefined_percentages:
        closest_lower = closest_upper = percentage
    else:
        closest_lower = max([p for p in predefined_percentages if p <= percentage])
        closest_upper = min([p for p in predefined_percentages if p >= percentage])

    folder = PHASE_MAP_IMG_FOLDER if image_type == "phase_map" else KAM_IMG_FOLDER
    img_lower_path = os.path.join(folder, f"phase_map_{closest_lower}.png")
    img_upper_path = os.path.join(folder, f"phase_map_{closest_upper}.png")

    return img_lower_path, img_upper_path, closest_lower, closest_upper

def generate_morphed_image(percentage, image_type):
    """Blends the two closest images to create an intermediate image."""
    img_lower_path, img_upper_path, lower_perc, upper_perc = find_closest_images(percentage, image_type)

    if not os.path.exists(img_lower_path) or not os.path.exists(img_upper_path):
        return None  

    img_lower = cv2.imread(img_lower_path)
    img_upper = cv2.imread(img_upper_path)

    alpha = (percentage - lower_perc) / (upper_perc - lower_perc) if upper_perc != lower_perc else 0
    morphed_img = cv2.addWeighted(img_lower, 1 - alpha, img_upper, alpha, 0)

    output_path = os.path.join(MORPHED_OUTPUT_FOLDER, f"generated_{percentage}.png")
    cv2.imwrite(output_path, morphed_img)

    return output_path

@app.route("/generate_image", methods=["POST"])
def generate_image():
    """Handles user request, morphs image, and returns the downloadable image file."""
    data = request.json
    percentage = data.get("percentage")
    image_type = data.get("type")  

    if percentage is None or image_type not in ["phase_map", "kam"]:
        return jsonify({"error": "Invalid request. Provide percentage and type."}), 400

    if percentage < 5:
        return jsonify({"error": "Enter minimum 5%"}), 400
    if percentage > 60:
        return jsonify({"error": "Enter maximum 60%"}), 400

    image_path = generate_morphed_image(percentage, image_type)
    if image_path is None:
        return jsonify({"error": "Could not generate image"}), 500

    return send_file(image_path, mimetype="image/png", as_attachment=True, download_name=f"elongation_{percentage}.png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
