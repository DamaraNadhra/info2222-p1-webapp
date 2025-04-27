"use client";

import { useState, type FC, useCallback, useEffect } from "react";
import { GrNotes } from "react-icons/gr";
import { GoFileSubmodule } from "react-icons/go";

import { FaCalendarAlt } from "react-icons/fa";
import { FaHandPaper } from "react-icons/fa";
import { DrawableCanvas } from "~/components/DrawableCanvas";
import { CalendarComponent } from "~/components/CalendarComponent";
import VotingComponent from "~/components/VotingComponent";
import { TbFileExport, TbMessageCircle } from "react-icons/tb";
import { EditorState, RichUtils, KeyBindingUtil } from "draft-js";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("draft-js").then((mod) => mod.Editor), {
  ssr: false,
});
import "draft-js/dist/Draft.css";
import { signOut, useSession } from "next-auth/react";
import { jsPDF } from "jspdf";

import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";

interface SidebarProps {
  onNotesClose: () => void;
  onCalendarClose: () => void;
  onVotingClose: () => void;
  onExportToPDF: () => void;
}

const Notes: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <div
      className={`absolute top-0 right-0 h-full w-1/2 border-l border-gray-200 bg-white p-4 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col items-center justify-between gap-2 pb-4">
        <span className="w-full pl-4 text-start text-2xl font-semibold">
          Private Notes
        </span>
        <DrawableCanvas />
      </div>
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({
  onNotesClose,
  onCalendarClose,
  onVotingClose,
  onExportToPDF,
}) => {
  return (
    <div className="flex w-24 flex-col border-r border-gray-200 bg-gray-100">
      {/* Panel/Notes Section */}
      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={() => onNotesClose()}
        >
          <GrNotes className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Notes</p>
      </div>

      {/* File Section */}
      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
        >
          <GoFileSubmodule className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">File</p>
      </div>

      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={() => onCalendarClose()}
        >
          <FaCalendarAlt className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Calendar</p>
      </div>

      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={() => onVotingClose()}
        >
          <FaHandPaper className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Voting</p>
      </div>

      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={onExportToPDF}
        >
          <TbFileExport className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Export to pdf</p>
      </div>

      <div className="mt-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center rounded p-2 text-left hover:bg-gray-200"
          onClick={() => {
            redirect("/chat");
          }}
        >
          <TbMessageCircle className="h-10 w-10" />
        </button>
        <p className="text-center text-xs">Chat</p>
      </div>
    </div>
  );
};

interface BottomToolbarProps {
  handleBold: () => void;
  handleItalic: () => void;
  handleStrikethrough: () => void;
  handleUnderline: () => void;
  editorState: EditorState;
}

const BottomToolbar: FC<BottomToolbarProps> = ({
  handleBold,
  handleItalic,
  handleStrikethrough,
  handleUnderline,
  editorState,
}) => {
  const currentStyle = editorState.getCurrentInlineStyle();
  const activeStyles = Array.from(currentStyle.toArray());
  const { data: session } = useSession();

  return (
    <div className="flex h-12 items-center justify-between gap-4 border-t border-gray-200 px-4">
      <ToggleGroup type="multiple" value={activeStyles}>
        <ToggleGroupItem
          value="BOLD"
          aria-label="Toggle bold"
          onClick={handleBold}
        >
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ITALIC"
          aria-label="Toggle italic"
          onClick={handleItalic}
        >
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="STRIKETHROUGH"
          aria-label="Toggle strikethrough"
          onClick={handleStrikethrough}
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="UNDERLINE"
          aria-label="Toggle underline"
          onClick={handleUnderline}
        >
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="flex items-center gap-2">
        <span className="text-xs">Logged in as {session?.user?.email}</span>
        <Button size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default function Home() {
  const [isNotesOpened, setIsNotesOpened] = useState(false);
  const [isVotingOpened, setIsVotingOpened] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [textContent, setTextContent] = useState("");
  const handleChange = (state: EditorState) => {
    setEditorState(state);
  };

  const handleKeyCommand = useCallback(
    (command: string, editorState: EditorState) => {
      const newState = RichUtils.handleKeyCommand(editorState, command);
      if (newState) {
        setEditorState(newState);
        return "handled";
      }
      return "not-handled";
    },
    [],
  );

  const handleBold = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "BOLD"));
  };

  const handleItalic = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "ITALIC"));
  };

  const handleStrikethrough = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "STRIKETHROUGH"));
  };

  const handleUnderline = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, "UNDERLINE"));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
    doc.text(text, 20, 30);
    doc.save("example.pdf");
  };

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signIn");
    }
  }, [status]);

  return (
    <div className="relative flex h-screen w-screen overflow-x-hidden transition-all duration-300">
      <Sidebar
        onNotesClose={() => setIsNotesOpened(!isNotesOpened)}
        onCalendarClose={() => setIsCalendarOpen(!isCalendarOpen)}
        onVotingClose={() => setIsVotingOpened(!isVotingOpened)}
        onExportToPDF={exportToPDF}
      />

      <div
        className={`flex overflow-hidden ${isNotesOpened ? "w-1/2" : "w-full"}`}
      >
        <main className={`flex flex-1 flex-col`}>
          {/* Main Content Area */}
          <div className="flex-1 p-4">
            <div className="h-full w-full rounded-lg border border-gray-200 bg-white p-4">
              <div className="prose prose-sm max-w-none focus:outline-none">
                <Editor
                  editorState={editorState}
                  onChange={handleChange}
                  handleKeyCommand={handleKeyCommand}
                  placeholder="Type here..."
                />
              </div>
            </div>
            <CalendarComponent
              isOpen={isCalendarOpen}
              onClose={() => setIsCalendarOpen(false)}
            />
          </div>

          <BottomToolbar
            handleBold={handleBold}
            handleItalic={handleItalic}
            handleStrikethrough={handleStrikethrough}
            handleUnderline={handleUnderline}
            editorState={editorState}
          />
        </main>

        <Notes isOpen={isNotesOpened} />
        <VotingComponent
          isOpen={isVotingOpened}
          onClose={() => setIsVotingOpened(false)}
        />
      </div>
    </div>
  );
}
