import { Toaster as Sonner } from "sonner"
import { useSettingsStore } from "@/stores/settingsStore"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useSettingsStore()

  return (
    <Sonner
      theme={theme === "system" ? "dark" : theme}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-green-500/50",
          error: "group-[.toaster]:border-red-500/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
