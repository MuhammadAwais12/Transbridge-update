import React, { ChangeEvent, useState } from "react";
import { File, X, AlertCircle, Loader2, Link } from "lucide-react";

interface FileInputProps {
  label: string;
  value: string | null;
  onChange: (fileUrl: string, fileName: string) => void;
  required?: boolean;
  validationError?: string | null;
  uploadFile: (file: File) => Promise<any>;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  value,
  onChange,
  required,
  validationError,
  uploadFile
}) => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadError(null);
      setIsUploading(true);

      try {
        const res = await uploadFile(file); // call API
        if (res.success && res.fileUrl) {
          onChange(res.fileUrl, file.name); // use the actual fileUrl from API response
          setIsUploaded(true);
          setUploadError(null);
        } else {
          console.error("Upload response missing fileUrl:", res);
          onChange("", ""); // Clear the input
          setIsUploaded(false);
          setUploadError("Upload failed: Invalid response from server");
          e.target.value = ''; // Reset the file input
        }
      } catch (err: any) {
        console.error("Upload failed:", err);
        onChange("", ""); // Clear the input
        setIsUploaded(false);
        setUploadError(err.message || "Upload failed. Please try again.");
        e.target.value = ''; // Reset the file input
      } finally {
        setIsUploading(false);
      }
    }
  };

  const clearFile = () => {
    setIsUploaded(false);
    setUploadError(null);
    setIsUploading(false);
    onChange("", "");
    // Also reset the actual file input
    const fileInput = document.getElementById(label) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      <div
        className={`flex items-center border rounded-lg overflow-hidden ${
          uploadError ? "border-red-500 bg-red-50" :
          validationError ? "border-red-500" : "border-gray-300"
        }`}
      >
        <input
          type="file"
          id={label}
          className="hidden"
          onChange={handleFileChange}
          required={required}
        />
        <span className={`flex-grow flex items-center px-3 py-2.5 text-sm ${uploadError ? "text-red-600" : "text-gray-500"} truncate`}>
          {uploadError ? (
            <>
              <AlertCircle size={18} className="mr-2 text-red-600" />
              {uploadError}
            </>
          ) : isUploading ? (
            <>
              <Loader2 size={18} className="mr-2 text-gray-600 animate-spin" />
              Uploading...
            </>
          ) : value ? (
            <>
              <Link size={18} className="mr-2 text-gray-600" />
              {value}
            </>
          ) : (
            <>
              <File size={18} className="mr-2 text-gray-600" />
              No file chosen
            </>
          )}
        </span>
        {value && !isUploading && (
          <button
            type="button"
            onClick={clearFile}
            className="px-3 text-gray-500 hover:text-red-500"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => document.getElementById(label)?.click()}
          disabled={isUploading}
          className={`px-3 py-2.5 text-sm ${
            isUploaded
              ? "bg-green-500 text-white hover:bg-green-600"
              : uploadError
              ? "bg-red-100 hover:bg-red-200 text-red-700"
              : isUploading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-sm"
          }`}
        >
          {isUploaded ? "Uploaded" : uploadError ? "Retry" : isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {validationError && (
        <p className="text-red-500 text-xs mt-1">{validationError}</p>
      )}
    </div>
  );
};

export default FileInput;
