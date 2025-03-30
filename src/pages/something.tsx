import { type FC } from "react";
import Head from "next/head";
import { FaFileAlt } from "react-icons/fa";
import { IoIosColorPalette } from "react-icons/io";
import { GrNotes } from "react-icons/gr";
import { GoFileSubmodule } from "react-icons/go";

import { FaCalendarAlt } from "react-icons/fa";
import { FaHandPaper } from "react-icons/fa";
import { CiShare2 } from "react-icons/ci";
import { useRouter } from "next/router";

const Sidebar: FC = () => {
  const router = useRouter();

  return (
    <div className="flex w-24 flex-col border-r border-gray-200 bg-gray-100">
      {/* Panel/Notes Section */}
      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={() => router.push("/notes")}
        >
          <GrNotes className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Notes</p>
      </div>

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

export default function Home() {
  return (
    <>
      <Head>
        <title>Web Editor</title>
        <meta name="description" content="Web Editor Interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen">
        <Sidebar />

        <main className="flex flex-1 flex-col">
          {/* Main Content Area */}
          <div className="flex-1 p-4">
            <div className="h-full w-full rounded-lg border border-gray-200 bg-white">
              {/* Web Content Goes Here */}
            </div>
          </div>

          <BottomToolbar />
        </main>
      </div>
    </>
  );
}
