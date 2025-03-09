import { ActionMenuRenderProps } from "@yoopta/action-menu-list";
import { cn } from "@/lib/utils";

export const NotionActionMenuRender = (props: ActionMenuRenderProps) => {
  const { empty, getItemProps, actions = [], getRootProps, view } = props;

  return (
    <ul
      {...getRootProps()}
      className={cn(
        "bg-background border rounded-md shadow-md p-1",
        view === "small" ? "w-48" : "w-64"
      )}
    >
      {empty && (
        <li className="px-2 py-1 text-muted-foreground text-sm">
          No actions available
        </li>
      )}
      {Array.isArray(actions) ? (
        actions.map((action) => (
          <li key={action.type} className="px-1">
            <button
              {...getItemProps(action.type)}
              className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted flex items-center gap-2"
            >
              {action.icon && (
                <span className="flex-shrink-0">{action.icon}</span>
              )}
              <div>
                <div className="font-medium">{action.title}</div>
                {action.description && (
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                )}
              </div>
            </button>
          </li>
        ))
      ) : (
        <li className="px-2 py-1 text-muted-foreground text-sm">
          Actions unavailable
        </li>
      )}
    </ul>
  );
};
