import { useCallback, useState, type FC } from "react";
import Head from "next/head";
import { TiArrowBack } from "react-icons/ti";
import { GoFileSubmodule } from "react-icons/go";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileWord } from "@fortawesome/free-solid-svg-icons";
import { FaCalendarAlt } from "react-icons/fa";
import { FaHandPaper } from "react-icons/fa";
import { CiShare2 } from "react-icons/ci";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";

const NotesPage: FC = () => {
  return (
    <div className="flex w-24 flex-col border-r border-gray-200 bg-gray-100">
      {/* File Section */}
      <div className="mt-2">
        <button className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200">
          <GoFileSubmodule className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">File</p>
      </div>

      <div className="mt-2">
        <button className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200">
          <FaCalendarAlt className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Calendar</p>
      </div>

      <div className="mt-2">
        <button className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200">
          <FaHandPaper className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Voting</p>
      </div>

      {/* Color/Styling Controls */}
      <div className="mt-2">
        <button className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200">
          <CiShare2 className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Share</p>
      </div>
    </div>
  );
};

const BottomToolbar: FC = () => {
  return (
    <div className="flex h-12 items-center gap-4 border-t border-gray-200 px-4">
      <button className="rounded p-2 hover:bg-gray-100">T</button>
      <button className="rounded p-2 hover:bg-gray-100">F</button>
      <button className="rounded p-2 hover:bg-gray-100">C</button>
      <button className="rounded p-2 hover:bg-gray-100">+</button>
    </div>
  );
};

export default function Notes() {
  const router = useRouter();
  const [filesDropped, setFilesDropped] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFilesDropped((prev) => [...prev, ...acceptedFiles]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });
  const renderFileName = (file: File) => {
    return (
      <div className="flex items-center gap-2">
        {file.type === "application/pdf" ? (
          <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
        ) : (
          <FontAwesomeIcon icon={faFileWord} className="text-blue-500" />
        )}
        {file.name}
      </div>
    );
  };
  return (
    <>
      <Head>
        <title></title>
        <meta name="description" content="Web Editor Interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen">
        <div className="flex flex-col">
          <button
            className="mt-2 flex h-fit w-12 cursor-pointer items-start justify-center rounded p-1 text-left hover:bg-gray-200"
            onClick={() => router.push("/")}
          >
            <TiArrowBack className="h-10 w-10" />
          </button>
          <p className="text-center text-xs">Main</p>
        </div>
        <main className="flex flex-1 flex-col">
          {/* Main Content Area */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-center h-full w-full rounded-lg border border-gray-200 bg-white">
              {/* Web Content Goes Here */}
              <div
                {...getRootProps()}
                className="cursor-pointer border-2 border-dashed p-10 text-center text-black w-1/3"
              >
                <input {...getInputProps()} />
                {filesDropped.length > 0 ? (
                  <div>{filesDropped.map((file) => renderFileName(file))}</div>
                ) : isDragActive ? (
                  <p>Drop the files here...</p>
                ) : (
                  <p>Drag & drop files here, or click to select files</p>
                )}
              </div>
            </div>
          </div>

          <BottomToolbar />
        </main>
      </div>
    </>
  );
}
