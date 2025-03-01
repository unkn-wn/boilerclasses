// Component that provides tab navigation between course overview and past instructors
import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import OverviewTabContent from './OverviewTabContent';
import GpaModal from '@/components/gpaModal';

const InstructorTabs = () => {
  return (
    <Tabs
      variant='soft-rounded'
      size='sm'
      colorScheme='gray'
      defaultIndex={0}
    >
      <TabList overflowY="hidden"
        sx={{
          scrollbarWidth: 'none',
          '::-webkit-scrollbar': {
            display: 'none',
          },
        }}>
        <Tab>Overview</Tab>
        <Tab>GPA Details</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <OverviewTabContent />
        </TabPanel>

        {/* GPA Details tab */}
        <TabPanel>
          <GpaModal />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InstructorTabs;
