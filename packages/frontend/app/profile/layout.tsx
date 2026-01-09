/**
 * ProfileLayout - Layout wrapper for profile pages
 * Maintains consistent styling for the profile section
 * Responsive: Full-width container with proper overflow handling for mobile
 */
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="w-full max-w-full">{children}</main>
    </div>
  );
}
