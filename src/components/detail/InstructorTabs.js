// Component that provides tab navigation between course overview and past instructors
import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import FullInstructorModal from '@/components/fullInstructorModal';
import InstructorSelector from './InstructorSelector';
import OverviewTabContent from './OverviewTabContent';

const InstructorTabs = ({
  courseData,
  defaultGPA,
  selectedInstructors,
  selectableInstructors,
  instructorStyles,
  curGPA,
  curRMP,
  gpaGraph,
  refreshGraph
}) => {
  return (
    <Tabs
      variant='soft-rounded'
      size='sm'
      colorScheme='gray'
      defaultIndex={selectedInstructors[selectedInstructors.length - 1] === "TBA" ? 1 : 0}
    >
      <TabList overflowY="hidden"
        sx={{
          scrollbarWidth: 'none',
          '::-webkit-scrollbar': {
            display: 'none',
          },
        }}>
        <Tab>Overview</Tab>
        <Tab>Past Instructors</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <OverviewTabContent
            defaultGPA={defaultGPA}
            selectableInstructors={selectableInstructors}
            selectedInstructors={selectedInstructors}
            instructorStyles={instructorStyles}
            refreshGraph={refreshGraph}
            curGPA={curGPA}
            curRMP={curRMP}
            gpaGraph={gpaGraph}
          />
        </TabPanel>

        {/* All Instructors Tab */}
        <TabPanel>
          <FullInstructorModal course={courseData} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InstructorTabs;
