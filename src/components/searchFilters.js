// searchFilters - filter component on home page

import React from 'react';

import { ChevronDownIcon, ChevronUpIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Collapse } from 'react-collapse';
import Select from 'react-select';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  Grid,
  Button
} from '@chakra-ui/react';

import { instructorStyles, subjectOptions, semesterOptions, genedsOptions } from '@/lib/utils';

const SearchFilters = ({ filters, updateFilter, filtersCollapsed, setFiltersCollapsed, allFiltersString }) => {
  return <>
    {/* Filters Section */}
    <div className="flex flex-col mb-4 gap-2">
      <Collapse isOpened={filtersCollapsed}>
        <div className='w-full flex place-content-end'>
          <div
            onClick={() => setFiltersCollapsed(false)}
            className='flex gap-2 items-center justify-center p-2 rounded-lg cursor-pointer bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 transition-all'
          >
            <HamburgerIcon />
            {allFiltersString ? (
              <p className="line-clamp-2 md:line-clamp-1 max-w-md">Filtering by {allFiltersString}</p>
            ) : (
              <p>Show filters</p>
            )}
          </div>
        </div>
      </Collapse>

      <Collapse isOpened={!filtersCollapsed}>
        <div className='flex flex-row items-center gap-5'>
          <p className='text-white whitespace-nowrap lg:block hidden'>Filter by </p>
          <div className='flex flex-row w-full justify-evenly gap-5 items-center lg:flex-nowrap flex-wrap'>
            {/* Subject Select */}
            <Select
              isMulti
              options={subjectOptions}
              className="basic-multi-select w-full"
              classNamePrefix="select"
              placeholder="Subject..."
              styles={instructorStyles}
              value={filters.subjects}
              closeMenuOnSelect={false}
              onChange={(value) => updateFilter('subjects', value)}
            />

            {/* Semester Select */}
            <Select
              isMulti
              options={semesterOptions}
              className="basic-multi-select w-full"
              classNamePrefix="select"
              placeholder="Semester..."
              styles={instructorStyles}
              value={filters.semesters}
              closeMenuOnSelect={false}
              onChange={(value) => updateFilter('semesters', value)}
            />

            {/* Gen ed Select */}
            <Select
              isMulti
              options={genedsOptions}
              className="basic-multi-select w-full"
              classNamePrefix="select"
              placeholder="Gen Ed..."
              styles={instructorStyles}
              value={filters.genEds}
              closeMenuOnSelect={false}
              onChange={(value) => updateFilter('genEds', value)}
            />

            {/* Credits Filter */}
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700'>
                  <span>Credits</span>
                  <ChevronDownIcon color='gray-800' />
                </button>
              </PopoverTrigger>
              <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-zinc-900 border-gray-800'>
                <PopoverBody paddingLeft={8} paddingRight={8} paddingTop={4} paddingBottom={4}>
                  <RangeSlider
                    aria-label={['min', 'max']}
                    defaultValue={[
                      (filters.credits.min * 100) / 18,
                      (filters.credits.max * 100) / 18
                    ]}
                    step={100 / 18}
                    onChange={(val) => updateFilter('credits', {
                      min: Math.round((val[0] * 18) / 100),
                      max: Math.round((val[1] * 18) / 100)
                    })}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <div className='text-white'>
                    {filters.credits.min} - {filters.credits.max} Credits
                  </div>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {/* Levels Filter */}
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700'>
                  <span>Level</span>
                  <ChevronDownIcon color='gray-800' />
                </button>
              </PopoverTrigger>
              <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800' width='fit-content'>
                <Grid templateColumns='repeat(3, 1fr)' gap={3} marginLeft={6} marginRight={6} paddingTop={3}>
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(level => (
                    <Checkbox
                      key={level}
                      size='md'
                      isChecked={filters.levels.includes(level)}
                      textColor='white'
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...filters.levels, level]
                          : filters.levels.filter(x => x !== level);
                        updateFilter('levels', newLevels);
                      }}
                    >
                      {level}
                    </Checkbox>
                  ))}
                </Grid>
                <div className='flex flex-row justify-evenly m-4 grow gap-2'>
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={() => updateFilter('levels', [100, 200, 300, 400, 500, 600, 700, 800, 900])}
                  >
                    Reset
                  </Button>
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={() => updateFilter('levels', [])}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Schedule Types Filter */}
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700'>
                  <span>Schedule</span>
                  <ChevronDownIcon color='gray-800' />
                </button>
              </PopoverTrigger>
              <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800' width='fit-content'>
                <Grid templateColumns='repeat(1, 1fr)' gap={3} marginLeft={6} marginRight={6} paddingTop={3}>
                  {[
                    "Lecture",
                    "Distance Learning",
                    "Studio",
                    "Individual Study",
                    "Clinic",
                    "Experiential",
                    "Research",
                    "Recitation",
                    "Practice Study Observation",
                    "Laboratory",
                    "Laboratory Preparation",
                    "Presentation"
                  ].map(schedType => (
                    <Checkbox
                      key={schedType}
                      size='md'
                      isChecked={filters.scheduleTypes.includes(schedType)}
                      textColor='white'
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.scheduleTypes, schedType]
                          : filters.scheduleTypes.filter(x => x !== schedType);
                        updateFilter('scheduleTypes', newTypes);
                      }}
                    >
                      {schedType}
                    </Checkbox>
                  ))}
                </Grid>
                <div className='flex flex-row justify-evenly m-4 grow gap-2'>
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={() => updateFilter('scheduleTypes', [
                      "Clinic",
                      "Distance Learning",
                      "Experiential",
                      "Individual Study",
                      "Laboratory",
                      "Laboratory Preparation",
                      "Lecture",
                      "Practice Study Observation",
                      "Presentation",
                      "Recitation",
                      "Research",
                      "Studio"
                    ])}
                  >
                    Reset
                  </Button>
                  <Button
                    size='sm'
                    className='w-full'
                    onClick={() => updateFilter('scheduleTypes', [])}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Collapse>

      {/* Hide filters button */}
      <Collapse isOpened={!filtersCollapsed}>
        <div className="flex flex-col w-full items-center text-white" >
          <button onClick={() => setFiltersCollapsed(true)} className="flex flex-col items-center cursor-pointer hover:-translate-y-1 transition" >
            <ChevronUpIcon />
            Hide filters
          </button>
        </div>
      </Collapse>
    </div>
  </>
}


export default SearchFilters;