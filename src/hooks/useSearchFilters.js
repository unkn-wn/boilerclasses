import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const DEFAULT_FILTERS = {
  subjects: [],
  semesters: [],
  genEds: [],
  credits: { min: 0, max: 18 },
  levels: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  scheduleTypes: [
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
  ]
};

// TODO: Make this dynamic
export const CURRENT_SEMESTER = "Fall 2025";
export const PREVIOUS_SEMESTER = "Spring 2025";

// Storage key for filters
const FILTERS_STORAGE_KEY = "boilerclasses_filters";

export const useSearchFilters = () => {
  const router = useRouter();
  const { query } = router;

  // Load filters from sessionStorage on initial render
  const getInitialFilters = () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return {
        ...DEFAULT_FILTERS,
        semesters: [{ label: CURRENT_SEMESTER, value: CURRENT_SEMESTER }],
        searchTerm: '',
      };
    }

    try {
      const savedFilters = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        return {
          ...parsedFilters,
          // Always ensure searchTerm from URL takes precedence
          searchTerm: query.q || parsedFilters.searchTerm || '',
        };
      }
    } catch (err) {
      console.error("Error loading filters from sessionStorage:", err);
    }

    return {
      ...DEFAULT_FILTERS,
      semesters: [{ label: CURRENT_SEMESTER, value: CURRENT_SEMESTER }],
      searchTerm: query.q || '',
    };
  };

  // Combined filters state
  const [filters, setFilters] = useState(getInitialFilters);

  // UI state
  const [displayLanding, setDisplayLanding] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [courses, setCourses] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Update specific filter
  const updateFilter = (filterName, value) => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        [filterName]: value
      };

      // Save to sessionStorage
      try {
        sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
      } catch (err) {
        console.error("Error saving filters to sessionStorage:", err);
      }

      return newFilters;
    });
  };

  // Transform search query
  const transformQuery = (query) => {
    if (!query) return "";
    return query.trim()
      .replaceAll(/[-;+]/g, " ")
      .replaceAll(/[~!#%$^&*()\[\]\{\}:'<>,@=|?.`"""]/g, "")
      .replaceAll(/[–—…«»'']/g, " ")
      .replaceAll(/([a-zA-Z])(\d)/g, '$1 $2')
      .trim();
  };

  // Check if we should show landing or results page
  useEffect(() => {
    // Wait for client-side rendering to complete
    if (typeof window === 'undefined') return;

    // Initialize the component
    if (!initialized) {
      // Check if we have any active filters to determine if we should show landing
      const hasActiveFilters =
        filters.searchTerm?.length > 1 ||
        filters.subjects.length > 0 ||
        filters.genEds.length > 0 ||
        (filters.semesters.length > 0 &&
         (filters.semesters.length !== 1 || filters.semesters[0].value !== CURRENT_SEMESTER));

      setDisplayLanding(!hasActiveFilters);
      setInitialized(true);
    }
  }, [filters, initialized]);

  // Handle search term from URL
  useEffect(() => {
    if (!router.isReady) return;

    if (query.q && query.q !== filters.searchTerm) {
      updateFilter('searchTerm', query.q);
    }
  }, [query.q, router.isReady]);

  // Search function
  const search = async () => {
    let { searchTerm, subjects, semesters, genEds, credits, levels, scheduleTypes } = filters;

    if (searchTerm && searchTerm.length <= 1 && subjects.length === 0 && semesters.length === 0 && genEds.length === 0) {
      setCourses([]);
      return;
    }

    const params = new URLSearchParams({
      q: transformQuery(searchTerm),
      sub: subjects.map(x => x.value),
      term: semesters.map(x => x.value),
      gen: genEds.map(x => x.value),
      cmin: credits.min,
      cmax: credits.max,
      levels,
      sched: scheduleTypes,
      maxlim: 100
    });

    try {
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      // Clean up descriptions
      const processedCourses = data.courses.documents.map(item => ({
        ...item,
        value: {
          ...item.value,
          description: item.value.description.startsWith("<a href=")
            ? "No Description Available"
            : item.value.description
        }
      }));

      setCourses(processedCourses);
    } catch (error) {
      console.error('Search failed:', error);
      setCourses([]);
    }
  };

  // Search effect
  useEffect(() => {
    if (initialized) {
      search();
    }
  }, [
    initialized,
    JSON.stringify(filters.subjects),
    JSON.stringify(filters.semesters),
    JSON.stringify(filters.genEds),
    transformQuery(filters.searchTerm),
    filters.credits.min,
    filters.credits.max,
    JSON.stringify(filters.levels),
    JSON.stringify(filters.scheduleTypes),
  ]);

  // Update search term in URL for shareable links
  useEffect(() => {
    if (!initialized || !router.isReady) return;

    if (filters.searchTerm) {
      router.replace({
        pathname: router.pathname,
        query: { q: filters.searchTerm }
      }, undefined, { shallow: true });
    } else if (query.q) {
      router.replace({
        pathname: router.pathname
      }, undefined, { shallow: true });
    }
  }, [filters.searchTerm, initialized, router.isReady]);

  return {
    filters,
    updateFilter,
    displayLanding,
    setDisplayLanding,
    filtersCollapsed,
    setFiltersCollapsed,
    courses,
    transformQuery,
  };
};