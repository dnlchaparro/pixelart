import { useTheme } from "../hooks/useTheme";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2 mt-auto">
      <label className="self-start">Theme</label>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="bit-border input px-2 py-1 bg-gray-200 dark:bg-gray-800 dark:text-white"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
};

export default ThemeSwitcher;
