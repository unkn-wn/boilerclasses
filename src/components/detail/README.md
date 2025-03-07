my bad, may have compartmentalized too far... claude helped a lot with moving around everything too
\- Leon

# Stucture of Details Page
Here's file structure of how the Details (`[id].js`) page looks now. The entire page is wrapped by a context called `DetailProvider` in the `components/detail/context/DetailContext.js` file. Contains most the states and functions that are used in the Details page, to help with state management and prop drilling.

(inside `src/components/detail/`)

- DetailPageHead.js

### Left Side
- CourseHeader.js
  - CourseInstructors.js
    - (All under this is wrapped in InstructorProvider from `context/InstructorContext.js`)
    - CourseInstructorContent
      - (Before dropdown)
        - InstructorItem.js
        - ExpandCollapseButton
      - (After dropdown)
        - InstructorSearch.js
        - SemesterGroup.js
          - SemesterHeader.js
          - InstructorItem.js
        - ExpandCollapseButton
- CourseLinks.js
- CourseDescription.js
- Prereqs.js

### Right Side
- InstructorTabs.js
  - (All under is the `Overview` Tab)
    - InstructorSelector.js
    - OverviewTabContent.js
      - CourseStats.js
        - CourseInfoPanel.js
          - OverallGpa.js (in `components/OverallGpa.js`)
          - GradeDistributionBar.js (in `components/GradeDistributionBar.js`)
        - InstructorMetricsPanel.js
          - AnimatedCircularProgress.js (in `components/AnimatedCircularProgress.js`)
      - graph.js (in `components/graph.js`)
      - ProfessorComparisonChart.js
  - (All under `All Grades` tab)
    - gpaModal.js
      - SearchBar.js (in `components/SearchBar.js`)
      - GpaTable.js

### Bottom
- calendar.js (in `components/calendar.js`)
- footer.js (in `components/footer.js`)


yay