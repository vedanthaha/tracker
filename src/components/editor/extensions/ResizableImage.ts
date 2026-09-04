import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageComponent from './ImageComponent';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { uploadImageAsset } from '../../../lib/uploadImage';

export interface ResizableImageOptions {
  HTMLAttributes: Record<string, any>;
  noteId?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      /**
       * Add a resizable image
       */
      setResizableImage: (options: { src: string; assetId?: string; alt?: string; caption?: string; width?: number; align?: 'left' | 'center' | 'right' | 'full' }) => ReturnType;
    }
  }
}

export const ResizableImage = Node.create<ResizableImageOptions>({
  name: 'resizableImage',
  group: 'block',
  draggable: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      noteId: undefined,
      onUploadStart: undefined,
      onUploadEnd: undefined,
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      assetId: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      keepRatio: {
        default: true,
      },
      align: {
        default: 'center',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent)
  },

  addCommands() {
    return {
      setResizableImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addProseMirrorPlugins() {
    const noteId = this.options.noteId;
    const onUploadStart = this.options.onUploadStart;
    const onUploadEnd = this.options.onUploadEnd;
    
    return [
      new Plugin({
        key: new PluginKey('imageDropPaste'),
        props: {
          handleDrop(view, event, slice, moved) {
            if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0 || moved) {
              return false;
            }

            const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length === 0) return false;

            event.preventDefault();

            // Setup placeholder
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const pos = coordinates ? coordinates.pos : view.state.selection.from;

            files.forEach(async (file) => {
              if (noteId) {
                try {
                  onUploadStart?.();
                  const data = await uploadImageAsset(file, noteId);
                  const node = view.state.schema.nodes.resizableImage.create({
                    src: data.publicUrl,
                    assetId: data.assetId,
                    alt: data.alt,
                  });
                  const transaction = view.state.tr.insert(pos, node);
                  view.dispatch(transaction);
                } catch (e) {
                  console.error("Upload failed", e);
                } finally {
                  onUploadEnd?.();
                }
              }
            });
            return true;
          },
          handlePaste(view, event, slice) {
            if (!event.clipboardData || !event.clipboardData.files || event.clipboardData.files.length === 0) {
              return false;
            }

            const files = Array.from(event.clipboardData.files).filter(file => file.type.startsWith('image/'));
            if (files.length === 0) return false;

            event.preventDefault();

            files.forEach(async (file) => {
              if (noteId) {
                try {
                  onUploadStart?.();
                  const data = await uploadImageAsset(file, noteId);
                  const node = view.state.schema.nodes.resizableImage.create({
                    src: data.publicUrl,
                    assetId: data.assetId,
                    alt: data.alt,
                  });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                } catch (e) {
                  console.error("Paste upload failed", e);
                } finally {
                  onUploadEnd?.();
                }
              }
            });
            return true;
          }
        }
      })
    ]
  }
})
