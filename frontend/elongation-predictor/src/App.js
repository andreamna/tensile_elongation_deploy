import { useState } from "react";
import './App.css';
import axios from "axios";

export default function ElongationPredictor() {
  const [percentage, setPercentage] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeSelection = (type) => {
    setSelectedType(type);
    setImageUrl(null);
    setError("");
  };

  const handlePercentageChange = (e) => {
    const value = parseFloat(e.target.value);
    setPercentage(value);

    if (value < 5) {
      setError("Enter minimum 5%");
    } else if (value > 60) {
      setError("Enter maximum 60%");
    } else {
      setError("");
    }
  };

  const handleGenerateImage = async () => {
    if (!percentage || !selectedType || error) return;
    setLoading(true);
    setImageUrl(null);

    try {
      const response = await axios.post(
        "https://tensile-elongation-backend.onrender.com/generate_image",
        { percentage: parseFloat(percentage), type: selectedType },
        { headers: { "Content-Type": "application/json" }, responseType: "blob" }
      );

      const imageUrl = URL.createObjectURL(response.data);
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Error generating image", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-darkPurple text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-6">Tensile Elongation Predictor</h1>

      <div className="flex gap-6 mb-4">
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          onClick={() => handleTypeSelection("kam")}
        >
          Generate KAM Image
        </button>
        <button
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          onClick={() => handleTypeSelection("phase_map")}
        >
          Generate Phase Map
        </button>
      </div>

      {selectedType && (
        <div className="flex flex-col items-center">
          <input
            type="number"
            placeholder="Enter elongation percentage"
            value={percentage}
            onChange={handlePercentageChange}
            className="mb-4 p-2 border border-gray-300 rounded-lg text-black"
            min="5" max="60"
          />
          {error && <p className="text-red-400 mb-2">{error}</p>}

          <button
            onClick={handleGenerateImage}
            disabled={loading || !percentage || error}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? "Generating..." : "Generate Image"}
          </button>
        </div>
      )}

      {imageUrl && (
        <div className="mt-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Generated Image:</h2>
          <img src={imageUrl} alt="Generated Elongation" className="w-64 h-64 object-contain border-2 border-gray-300 rounded-lg mb-4" />
          <a
            href={imageUrl}
            download={`elongation_${percentage}.png`}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
