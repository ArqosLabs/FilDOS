"use client";

import { useState } from "react";
import FloatingActionButton from "./floating-action-button";
import Header from "./header";
import Sidebar from "./sidebar";
import FileGrid from "./file-grid";
import FileList from "./file-list";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "video" | "pdf" | "other";
  size?: string;
  modified: string;
  owner: string;
  starred: boolean;
  shared: boolean;
}

const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "My Documents",
    type: "folder",
    modified: "Dec 15, 2024",
    owner: "me",
    starred: false,
    shared: false,
  },
  {
    id: "2",
    name: "Project Proposal.docx",
    type: "document",
    size: "2.4 MB",
    modified: "Dec 20, 2024",
    owner: "me",
    starred: true,
    shared: true,
  },
  {
    id: "3",
    name: "vacation-photos",
    type: "folder",
    modified: "Dec 18, 2024",
    owner: "me",
    starred: false,
    shared: false,
  },
  {
    id: "4",
    name: "presentation.pdf",
    type: "pdf",
    size: "5.8 MB",
    modified: "Dec 19, 2024",
    owner: "john@example.com",
    starred: false,
    shared: true,
  },
  {
    id: "5",
    name: "logo.png",
    type: "image",
    size: "1.2 MB",
    modified: "Dec 17, 2024",
    owner: "me",
    starred: true,
    shared: false,
  },
  {
    id: "6",
    name: "demo-video.mp4",
    type: "video",
    size: "15.6 MB",
    modified: "Dec 16, 2024",
    owner: "me",
    starred: false,
    shared: false,
  },
];

export default function DriveClone() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleStar = (fileId: string) => {
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, starred: !file.starred } : file
    ));
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === "grid" ? (
            <FileGrid 
              files={files} 
              selectedFiles={selectedFiles}
              onToggleStar={toggleStar}
              onToggleSelection={toggleFileSelection}
            />
          ) : (
            <FileList
              files={files} 
              selectedFiles={selectedFiles}
              onToggleStar={toggleStar}
              onToggleSelection={toggleFileSelection}
            />
          )}
        </main>
      </div>
      <FloatingActionButton />
    </div>
  );
}
