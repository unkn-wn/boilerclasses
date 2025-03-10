// Component that provides tab navigation between course overview and past instructors
import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import OverviewTabContent from './OverviewTabContent';
import GpaModal from '@/components/detail/gpaModal';
import InstructorSelector from './InstructorSelector';
import { useDetailContext } from './context/DetailContext';

const InstructorTabs = () => {
  const {
    defaultGPA,
    selectableInstructors,
    selectedInstructors,
    refreshGraph,
    shouldHighlightOverviewTab,
  } = useDetailContext();

  // Check if we have datasets to display
  const hasDefaultGPAData = defaultGPA?.datasets &&
    Array.isArray(defaultGPA.datasets) &&
    defaultGPA.datasets.length > 0;

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
        },
      }}
    >
      <TabList overflowY=""
        sx={{
          scrollbarWidth: 'none',
          '::-webkit-scrollbar': {
            display: 'none',
          },
        }}>
        {/* Enhanced visual highlight for the Overview tab */}
        <div className="relative">
          <Tab zIndex={1} position="relative">Overview</Tab>
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ease-in-out ${
              shouldHighlightOverviewTab
                ? 'bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,1)] border border-blue-400 scale-105'
                : 'bg-transparent border-transparent scale-100'
            }`}
          ></div>
        </div>
        <Tab>All Grades</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          {/* Fixed InstructorSelector at the top */}
          {hasDefaultGPAData && (
            <div className='mb-4'>
              <InstructorSelector
                instructors={selectableInstructors}
                selectedInstructors={selectedInstructors}
                onChange={(value) => refreshGraph(value)}
              />
            </div>
          )}
          <div className="-m-4 p-4 md:overflow-y-auto md:max-h-screen">
            <OverviewTabContent />
            <div className='hidden sm:block h-40' />
          </div>
        </TabPanel>

        {/* GPA Details tab (lazy loaded) */}
        <TabPanel>
          <div className="-m-4 p-4 md:overflow-y-auto md:max-h-screen">
            <GpaModal />
            <div className='hidden sm:block h-40' />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InstructorTabs;
