import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SlashCommandList from './SlashCommandList';
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, Minus, Image as ImageIcon } from 'lucide-react';
import { uploadImageAsset } from '../../../lib/uploadImage';

export default {
  items: ({ query }: { query: string }) => {
    return [
      {
        title: 'Heading 1',
        icon: Heading1,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        icon: Heading2,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        icon: Heading3,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
        },
      },
      {
        title: 'Bullet List',
        icon: List,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Numbered List',
        icon: ListOrdered,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: 'Checklist',
        icon: CheckSquare,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: 'Quote',
        icon: Quote,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: 'Code Block',
        icon: Code,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: 'Divider',
        icon: Minus,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
      {
        title: 'Image',
        icon: ImageIcon,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).run();
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png, image/jpeg, image/webp, image/gif';
          input.onchange = async () => {
            if (input.files?.length) {
              const file = input.files[0];
              const noteId = editor.extensionManager.extensions.find((e: any) => e.name === 'resizableImage')?.options.noteId;
              if (noteId) {
                try {
                  const data = await uploadImageAsset(file, noteId);
                  editor.chain().focus().setResizableImage({
                    src: data.publicUrl,
                    assetId: data.assetId,
                    alt: data.alt
                  }).run();
                } catch (e) {
                  console.error('Image upload failed', e);
                }
              }
            }
          };
          input.click();
        },
      },
      {
        title: 'Table',
        icon: require('lucide-react').Table,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
    ]
      .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10);
  },

  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
