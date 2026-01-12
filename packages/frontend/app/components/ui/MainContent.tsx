import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/app/lib/utils';

/**
 * MainContent - Semantic wrapper for the main content area
 *
 * This component provides the `main` landmark with the skip link target ID.
 * It ensures proper semantic structure for accessibility and enables the
 * skip link functionality from layout.tsx.
 *
 * WCAG 2.2 AA Compliance:
 * - Success Criterion 1.3.1 (Info and Relationships) - main landmark
 * - Success Criterion 2.4.1 (Bypass Blocks) - skip link target
 * - Success Criterion 2.4.6 (Headings and Labels) - content structure
 *
 * @example
 * ```tsx
 * // Basic usage in a page
 * export default function CampaignsPage() {
 *   return (
 *     <>
 *       <Navbar />
 *       <MainContent>
 *         <h1>Campaigns</h1>
 *         {content}
 *       </MainContent>
 *     </>
 *   );
 * }
 *
 * // With custom aria-label
 * <MainContent aria-label="Campaign browser">
 *   {content}
 * </MainContent>
 * ```
 */

export interface MainContentProps extends HTMLAttributes<HTMLElement> {
  /**
   * The main content to render
   */
  children: ReactNode;

  /**
   * The ID used by the skip link to target this element
   * @default "main-content"
   */
  id?: string;

  /**
   * Whether to remove the tabindex that allows the element to receive focus
   * when navigating via skip link. Should be true if content starts with
   * a focusable element.
   * @default false
   */
  skipTabIndex?: boolean;
}

export function MainContent({
  children,
  id = 'main-content',
  skipTabIndex = false,
  className,
  ...props
}: MainContentProps) {
  return (
    <main
      id={id}
      role="main"
      // tabindex="-1" allows the element to receive focus programmatically
      // (from skip link) but not be part of the tab order
      tabIndex={skipTabIndex ? undefined : -1}
      className={cn(
        // Remove focus outline since this is not a interactive element
        // Focus is only used for skip link navigation
        'outline-none',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

/**
 * ContentSection - Semantic wrapper for content sections within MainContent
 *
 * Use this for distinct sections within the main content that could benefit
 * from additional semantic structure or skip link targets.
 *
 * @example
 * ```tsx
 * <MainContent>
 *   <ContentSection aria-labelledby="campaigns-heading">
 *     <h2 id="campaigns-heading">Active Campaigns</h2>
 *     {campaigns}
 *   </ContentSection>
 *
 *   <ContentSection aria-labelledby="stats-heading">
 *     <h2 id="stats-heading">Statistics</h2>
 *     {stats}
 *   </ContentSection>
 * </MainContent>
 * ```
 */

export interface ContentSectionProps extends HTMLAttributes<HTMLElement> {
  /**
   * The section content
   */
  children: ReactNode;

  /**
   * The semantic element to use
   * @default "section"
   */
  as?: 'section' | 'article' | 'div';
}

export function ContentSection({
  children,
  as: Component = 'section',
  className,
  ...props
}: ContentSectionProps) {
  return (
    <Component className={cn(className)} {...props}>
      {children}
    </Component>
  );
}

/**
 * AsideContent - Semantic wrapper for complementary sidebar content
 *
 * Use this for sidebars and complementary content that is related to
 * but separate from the main content.
 *
 * WCAG 2.2 AA:
 * - Creates proper complementary landmark
 *
 * @example
 * ```tsx
 * <MainContent>
 *   <div className="flex">
 *     <div>{mainContent}</div>
 *     <AsideContent aria-label="Sidebar">
 *       <Leaderboard />
 *       <PeopleToFollow />
 *     </AsideContent>
 *   </div>
 * </MainContent>
 * ```
 */

export interface AsideContentProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function AsideContent({
  children,
  className,
  ...props
}: AsideContentProps) {
  return (
    <aside role="complementary" className={cn(className)} {...props}>
      {children}
    </aside>
  );
}

/**
 * NavContent - Semantic wrapper for navigation sections
 *
 * Use this for navigation areas that need proper landmark structure.
 * Always provide an aria-label to distinguish between multiple nav landmarks.
 *
 * @example
 * ```tsx
 * <NavContent aria-label="Main navigation">
 *   <ul>
 *     <li><a href="/home">Home</a></li>
 *     <li><a href="/campaigns">Campaigns</a></li>
 *   </ul>
 * </NavContent>
 *
 * <NavContent aria-label="Page navigation">
 *   <ul>
 *     <li><button onClick={goToPrev}>Previous</button></li>
 *     <li><button onClick={goToNext}>Next</button></li>
 *   </ul>
 * </NavContent>
 * ```
 */

export interface NavContentProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function NavContent({
  children,
  className,
  ...props
}: NavContentProps) {
  return (
    <nav role="navigation" className={cn(className)} {...props}>
      {children}
    </nav>
  );
}

/**
 * FooterContent - Semantic wrapper for footer content
 *
 * @example
 * ```tsx
 * <FooterContent>
 *   <p>&copy; 2026 FundBrave. All rights reserved.</p>
 *   <nav aria-label="Footer navigation">
 *     <a href="/privacy">Privacy</a>
 *     <a href="/terms">Terms</a>
 *   </nav>
 * </FooterContent>
 * ```
 */

export interface FooterContentProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function FooterContent({
  children,
  className,
  ...props
}: FooterContentProps) {
  return (
    <footer role="contentinfo" className={cn(className)} {...props}>
      {children}
    </footer>
  );
}

export default MainContent;
