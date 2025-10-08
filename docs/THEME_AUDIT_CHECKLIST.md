# Theme Audit Checklist

## Pre-Testing Setup
- [ ] Clear browser cache
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile and desktop viewports
- [ ] Verify theme toggle is accessible and functional

## Global Elements
- [ ] Page background adapts to theme
- [ ] Base text color is readable in both themes
- [ ] Focus rings are visible in both themes
- [ ] Scrollbar colors adapt to theme
- [ ] App loader styling works in both themes
- [ ] Error states are visible in both themes

## Navigation & Layout
- [ ] Sidebar background and text adapt
- [ ] Sidebar branding and tagline are readable
- [ ] Navigation items have proper contrast
- [ ] Active navigation item is distinguishable
- [ ] Hover states are visible on nav items
- [ ] Social links and tooltips adapt
- [ ] Mobile hamburger menu styling adapts
- [ ] Mobile overlay is appropriate for both themes
- [ ] Skip link is visible when focused

## Home / Chat Interface
- [ ] Welcome card background and text adapt
- [ ] Welcome card border is visible
- [ ] Suggestion chips are readable and interactive
- [ ] Suggestion chip hover states work
- [ ] Chat messages (user) are readable
- [ ] Chat messages (assistant) are readable
- [ ] User and assistant messages are distinguishable
- [ ] Typing indicator is visible
- [ ] Chat input field is usable
- [ ] Chat input placeholder text is readable
- [ ] Send button is visible and interactive
- [ ] Experience context indicator (if shown) is clear

## Projects Page
- [ ] Page headline is readable
- [ ] Page description has proper contrast
- [ ] Project card backgrounds adapt
- [ ] Project card borders are visible
- [ ] Project card text (title, description) is readable
- [ ] Project card tags are visible
- [ ] Project card hover states work (lift, shadow, border)
- [ ] Project card focus states are visible
- [ ] Project thumbnails display correctly

## Resume Page
- [ ] Page title is readable
- [ ] Summary text has proper contrast
- [ ] Download button styling adapts
- [ ] Download button hover state works
- [ ] Experience card backgrounds adapt
- [ ] Experience card borders are visible
- [ ] Experience level badges are readable
- [ ] Experience titles and companies are readable
- [ ] Experience descriptions have proper contrast
- [ ] Achievement lists are readable
- [ ] Skill tags are visible and readable
- [ ] Technology badges are visible
- [ ] Chat toggle button is visible
- [ ] Experience chat interface adapts (when opened)
- [ ] Experience chat messages are readable
- [ ] Experience chat input is usable

## Interactive States
- [ ] All hover states are visible in both themes
- [ ] All focus states meet accessibility standards
- [ ] All active/pressed states are clear
- [ ] Disabled states (if any) are distinguishable
- [ ] Loading states are visible

## Accessibility Validation
- [ ] Run WAVE or axe DevTools in both themes
- [ ] Verify contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Test with screen reader (VoiceOver, NVDA, JAWS)
- [ ] Verify theme state is announced to screen readers
- [ ] Test keyboard navigation in both themes
- [ ] Verify reduced motion preferences are respected

## Edge Cases
- [ ] Theme persists across page refreshes
- [ ] Theme persists across navigation
- [ ] Theme toggle animation is smooth
- [ ] No flash of unstyled content (FOUC) on load
- [ ] System theme preference is respected on first visit
- [ ] Theme works with browser zoom (100%, 150%, 200%)
- [ ] Theme works with browser dark mode extensions disabled

## Performance
- [ ] Theme toggle is instant (no lag)
- [ ] No layout shift when toggling theme
- [ ] No unnecessary re-renders
- [ ] CSS variables are efficiently applied

## Documentation
- [ ] Update README with theme implementation details
- [ ] Document any theme-specific design decisions
- [ ] Note any components that intentionally don't adapt (if any)

---

**Testing Notes:**

Use this section to document any issues found during testing, including:
- Component name
- Issue description
- Theme where issue occurs (light/dark/both)
- Screenshot or reproduction steps
- Severity (critical/major/minor)

**Sign-off:**

- [ ] All critical issues resolved
- [ ] All major issues resolved or documented
- [ ] Minor issues documented for future iteration
- [ ] Theme implementation approved for production
