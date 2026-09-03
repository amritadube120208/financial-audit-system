import { apiClient } from "./client";
import { Dataset } from "../types/api";

export async function uploadDatasetFile(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<Dataset>("/api/v1/datasets", {
    method: "POST",
    body: formData,
  });
}

export async function getDataset(datasetId: string): Promise<Dataset> {
  return apiClient<Dataset>(`/api/v1/datasets/${datasetId}`);
}
