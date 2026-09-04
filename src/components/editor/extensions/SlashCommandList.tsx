import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const SlashCommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      className="flex flex-col gap-1 p-2 rounded-xl shadow-lg border"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--card-border)',
        minWidth: '200px',
      }}
    >
      {props.items.length ? (
        props.items.map((item: any, index: number) => {
          const Icon = item.icon;
          return (
            <button
              className="flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg transition-colors"
              key={index}
              onClick={() => selectItem(index)}
              style={{
                color: 'var(--foreground)',
                background: index === selectedIndex ? 'color-mix(in srgb, var(--foreground) 10%, transparent)' : 'transparent',
              }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center rounded-md"
                style={{
                  background: 'color-mix(in srgb, var(--foreground) 5%, transparent)',
                  color: 'var(--muted)',
                }}
              >
                <Icon size={14} />
              </div>
              {item.title}
            </button>
          );
        })
      ) : (
        <div className="px-3 py-2 text-sm text-center" style={{ color: 'var(--muted)' }}>
          No results
        </div>
      )}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
export default SlashCommandList;
