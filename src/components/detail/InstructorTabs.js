// Component that provides tab navigation between course overview and past instructors
import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import FullInstructorModal from '@/components/fullInstructorModal';
import OverviewTabContent from './OverviewTabContent';
import { useDetailContext } from '@/components/detail/context/DetailContext';

const InstructorTabs = () => {
  const { selectedInstructors } = useDetailContext();

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
          <OverviewTabContent />
        </TabPanel>

        {/* All Instructors Tab */}
        <TabPanel>
          <FullInstructorModal />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InstructorTabs;
