import prettyBytes from "pretty-bytes";

import { round } from "lodash";
import { useState } from "react";
import {
  DocumentIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

async function uploadFileToS3UsingAxios(
  signedUrl: string,
  file: File,
  progressCallback: (percentage: number) => void
) {
  const config = {
    headers: {
      "Content-Type": file.type, // Set content type to file type
    },
    onUploadProgress: (progressEvent: {
      lengthComputable: any;
      loaded: number;
      total?: number;
    }) => {
      if (progressEvent.lengthComputable) {
        const percentage =
          (progressEvent.loaded / (progressEvent?.total || 1)) * 100;
        progressCallback(percentage);
      }
    },
  };

  try {
    const response = await axios.put(signedUrl, file, config);
    return response;
  } catch (error) {
    console.log("ERROR", error);
    console.error("Upload failed:", error);
    return error;
  }
}

const UploadProgressBar = ({ progress }: { progress: number }) => (
  <div className="py-5 flex-grow">
    <div className="w-full bg-gray-200 rounded-full">
      <div
        className={`${
          progress === 0 ? "invisible" : ""
        } bg-indigo-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full`}
        style={{ width: progress + "%" }}
      >
       {
        progress
        ? <span>{(round(progress, 2))}%</span>
        : <span>Uploaded</span>
       }
      </div>
    </div>
  </div>
);

function FileIconImage({ type }: { type: string }) {
  switch (type) {
    case "image/jpeg":
    case "image/png":
    case "image/gif":
      return <PhotoIcon className="w-12 h-12 p-1 text-gray-300" />;
    default:
      return <DocumentIcon className="w-12 h-12 p-1 text-gray-300" />;
  }
}

async function generateChecksum(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

interface iProps {
  record_id: string;
  onUploadComplete?: (attachmentId: string) => void;
  existingUploads?: any[];
}

export default function FileUploader({ record_id, onUploadComplete, existingUploads = [] }: iProps) {
  const [inputValue, setInputValue] = useState("");
  const [draggingOver, setDraggingOver] = useState(false);
  const [uploads, setUploads] = useState<any[]>(existingUploads.map((f) => ({
    name: f.file_name,
    type: f.file_type,
    size: f.byte_size,
    ...f
  })));
  const [fileUploadProgress, setFileUploadProgress] = useState<
    Record<string, number>
  >({});
  const [attachmentId, setAttachmentId] = useState("");

  const addFiles = (files: File[]) => {
    const newFiles = files.filter(
      (f) => uploads.findIndex((u) => u.name === f.name) === -1
    );

    const uploadFile = async (file: File) => {
      const payload = {
        name: file.name,
        type: file.type,
        size: file.size,
        checksum: await generateChecksum(file),
        record_id,
      };

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const jsonData = await response.json();
        console.log("JSON Response:", jsonData);
        setAttachmentId(jsonData.data.id);
        await uploadFileToS3UsingAxios(jsonData.data.url, file, (percentage) => {
          setFileUploadProgress({
            ...fileUploadProgress,
            [file.name]: percentage,
          });
        });
        onUploadComplete && onUploadComplete(jsonData.data.id);
        console.log("JSON Response:", jsonData);
      } else {
        console.error("Error:", response.status, response.statusText);
      }
    };

    newFiles.forEach(uploadFile);

    const updatedProgress = { ...fileUploadProgress };
    newFiles.forEach((file) => {
      updatedProgress[file.name] = round(Math.random() * 100, 2);
    });
    setFileUploadProgress(updatedProgress);

    setUploads([...uploads, ...newFiles]);
  };

  const onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles: File[] = [...(event.target.files || [])];
    addFiles(newFiles);
  };

  const removeItem = (index: number) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);
  };

  const uploadClicked = () => {
    if (!uploads.length) {
      return;
    }

    uploads.forEach((upload) => upload.uploader.start());
  };

  const stopEvent = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: any) => {
    stopEvent(e);
  };

  const handleDragLeave = (e: any) => {
    stopEvent(e);
    setDraggingOver(false);
  };

  const handleDragOver = (e: any) => {
    stopEvent(e);
    setDraggingOver(true);
  };

  const handleDrop = (e: any) => {
    stopEvent(e);
    setDraggingOver(false);
    const files = [...e.dataTransfer.files];
    addFiles(files);
  };

  return (
    <div className="py-4">
      <div className="flex text-sm text-gray-600">
        <div className="w-full">
          <div
            className={`${
              draggingOver ? "border-blue-500" : "border-gray-300"
            } mt-1 flex items-center hover:border-gray-400 justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            // onClick={() => document.getElementById('file-upload')?.click()}
          >
            <label
              htmlFor="file-upload"
              className="inline-flex items-center rounded border border-transparent bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="text-md">Choose File</div>
              <input
                id="file-upload"
                name="files"
                type="file"
                className="sr-only"
                onChange={onFilesChanged}
                multiple
                value={inputValue}
              />
            </label>
            <p className="pl-1 text-sm">or drag and drop</p>
          </div>
        </div>
      </div>

      <p className="py-2 text-sm text-gray-500">Any file up to 10MB</p>

      {uploads.map((file, index) => (
        <div
          key={file.name + index}
          className="py-2 flex flex-col md:flex-row my-1 justify-between items-center border border-gray rounded-md p-2"
        >
          <div className="flex w-full md:w-3/5 items-center gap-2">
            <FileIconImage type={file.type} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 max-w-xs truncate w-52">
                {file.name}
              </span>
              <span className="text-sm text-gray-500">
                {file.name.split(".").pop().toUpperCase()} <span>|</span>{" "}
                {prettyBytes(file.size)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-grow w-full w-100">
            <UploadProgressBar progress={fileUploadProgress[file.name]} />

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded-full border p-2 hover:bg-gray-100"
            >
              <span className="sr-only">Delete</span>
              <TrashIcon className="w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
