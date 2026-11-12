"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  FileCode,
  CheckSquare,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  onGenerateCriteria?: () => void;
  isGeneratingCriteria?: boolean;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = "Nhập mô tả chi tiết, tiêu chí nghiệm thu...",
  readOnly = false,
  minHeight = "140px",
  onGenerateCriteria,
  isGeneratingCriteria = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content: content || "",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update content if external content changes meaningfully
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && !editor.isFocused) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor]);

  // Update editable mode if readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!isMounted) {
    return (
      <div
        className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 text-xs text-gray-400 animate-pulse flex items-center justify-center"
        style={{ minHeight }}
      >
        <span>Đang khởi tạo trình soạn thảo Jira Rich-Text...</span>
      </div>
    );
  }

  if (!editor) return null;

  return (
    <div className={`w-full border rounded-lg overflow-hidden transition-all duration-150 ${
      readOnly
        ? "border-gray-200 bg-gray-50/50"
        : "border-gray-300 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-[#0052CC]/20 bg-white"
    }`}>
      {/* Toolbar - Only visible when not readOnly */}
      {!readOnly && (
        <div className="bg-[#FAFBFC] border-b border-gray-200 px-2 py-1.5 flex flex-wrap items-center justify-between gap-1 text-gray-700 select-none">
          {/* Format buttons */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("bold") ? "bg-gray-200 text-[#0052CC] font-bold" : ""
              }`}
              title="Đậm (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("italic") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Nghiêng (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("strike") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Gạch ngang"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("code") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-gray-300 mx-1" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs font-semibold transition ${
                editor.isActive("heading", { level: 1 }) ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Tiêu đề 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs font-semibold transition ${
                editor.isActive("heading", { level: 2 }) ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Tiêu đề 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs font-semibold transition ${
                editor.isActive("heading", { level: 3 }) ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Tiêu đề 3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-gray-300 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("bulletList") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Danh sách gạch đầu dòng"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("orderedList") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Danh sách đánh số"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("blockquote") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Trích dẫn (Quote)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded hover:bg-gray-200 text-xs transition ${
                editor.isActive("codeBlock") ? "bg-gray-200 text-[#0052CC]" : ""
              }`}
              title="Khối mã (Code block)"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-gray-300 mx-1" />

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-gray-200 text-xs transition disabled:opacity-30 disabled:hover:bg-transparent"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-gray-200 text-xs transition disabled:opacity-30 disabled:hover:bg-transparent"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Helper Button */}
          {onGenerateCriteria && (
            <button
              type="button"
              onClick={onGenerateCriteria}
              disabled={isGeneratingCriteria}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition disabled:opacity-50"
              title="Tự động sinh tiêu chí nghiệm thu chuẩn BDD Given-When-Then"
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>{isGeneratingCriteria ? "Đang sinh tiêu chí..." : "Sinh Tiêu Chí BDD"}</span>
            </button>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-3 text-xs text-gray-900 leading-relaxed font-sans" style={{ minHeight }}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none focus:outline-none min-h-[100px]
            [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1 [&_h1]:text-gray-900
            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1.5 [&_h2]:mt-1 [&_h2]:text-gray-800
            [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:text-gray-800
            [&_p]:mb-1.5 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
            [&_li]:mb-0.5
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2
            [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-pink-600
            [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto"
        />
      </div>
    </div>
  );
};

