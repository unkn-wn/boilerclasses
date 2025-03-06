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
      defaultIndex={0}
      isLazy
      lazyBehavior="keepMounted"
      sx={{
        // Tab list container
        '& .chakra-tabs__tablist': {
          gap: '8px',
        },
        // Individual tab styling
        '& .chakra-tabs__tab': {
          color: 'rgb(var(--text-tertiary-color))',
          fontWeight: '500',
          backgroundColor: 'transparent',
          transition: 'all 0.2s ease',
          _hover: {
            color: 'rgb(var(--text-secondary-color))',
            backgroundColor: 'rgba(var(--background-tertiary-color))',
          },
          _selected: {
            color: 'rgb(var(--text-opposite))',
            backgroundColor: 'rgb(var(--background-opposite))',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            fontWeight: '600',
          },
          _active: {
            backgroundColor: 'rgba(var(--background-tertiary-color))',
          },
        },
        // Tab panels
        '& .chakra-tabs__tab-panel': {
          padding: '0',
          paddingTop: '1rem',
        }
      }}
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
          <div className="overflow-y-auto max-h-screen">
            <OverviewTabContent />
            <div className='h-40' />
          </div>
        </TabPanel>

        {/* GPA Details tab - now lazy loaded */}
        <TabPanel>
          <div className="overflow-y-auto max-h-screen">
            <GpaModal />
            <div className='h-40' />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InstructorTabs;
