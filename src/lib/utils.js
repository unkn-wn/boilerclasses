export const genedName = [
  { "id": "COOP", "name": "Cooperative Education" },
  { "id": "CTL", "name": "Core Transfer Library" },
  { "id": "CREX", "name": "Credit By Examination" },
  { "id": "DPCR", "name": "Departmental Credit" },
  { "id": "DUAL", "name": "Dual Credit Transfer Work" },
  { "id": "EXPT", "name": "Exempt" },
  { "id": "FTPV", "name": "Full-Time Privileges" },
  { "id": "HTPV", "name": "Half-Time Privileges" },
  { "id": "HONR", "name": "Honors" },
  { "id": "IMPC", "name": "Impact Courses" },
  { "id": "INTR", "name": "Internship" },
  { "id": "JEDI", "name": "JEDI" },
  { "id": "LTHT", "name": "Less Than Half Time Enrollment" },
  { "id": "LOWR", "name": "Lower Division" },
  { "id": "MILT", "name": "Military" },
  { "id": "PCOP", "name": "Parallel Cooperative Education" },
  { "id": "PRCT", "name": "Practicum" },
  { "id": "REMD", "name": "Remedial" },
  { "id": "SL", "name": "Service Learning" },
  { "id": "SGNL", "name": "Signal Courses" },
  { "id": "STCH", "name": "Student Teaching" },
  { "id": "UC06", "name": "Behavior/Social Science" },
  { "id": "UC05", "name": "Humanities" },
  { "id": "UC02", "name": "Information Literacy" },
  { "id": "UC03", "name": "Oral Communications" },
  { "id": "UC07", "name": "Quantitative Reasoning" },
  { "id": "UC04", "name": "Science" },
  { "id": "UC08", "name": "Science, Technology & Society" },
  { "id": "UC01", "name": "Written Communication" },
  { "id": "UPPR", "name": "Upper Division" },
  { "id": "VART", "name": "Variable Title" }
]

export const subjectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    background: "#000000",
    borderColor: '#18181b',
    paddingLeft: "4px",
    color: 'white',
    ':hover': {
      borderColor: '#18181b'
    },
    ':focus': {
      outline: "none"
    }
  }),
  menuList: styles => ({
    ...styles,
    borderColor: '#18181b',
    background: '#000000'
  }),
  option: (styles, { isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
          ? "#9333ea"
          : isFocused
            ? "#d8b4fe"
            : undefined,
      color: isDisabled
        ? '#ccc'
        : isFocused
          ? "#9333ea"
          : "white",
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? "#9333ea"
            : "#d8b4fe"
          : undefined,
      }
    }
  },
  menu: base => ({
    ...base,
    zIndex: 100,
    color: 'white'
  }),

  multiValue: (styles, { data }) => {
    return {
      ...styles,
      backgroundColor: "#d8b4fe",
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
    ':hover': {
      backgroundColor: "#9333ea",
      color: 'white',
    },
  }),

  input: (styles, { data }) => ({
    ...styles,
    color: "white",
  }),
  indicatorSeparator: (styles, { data }) => ({
    ...styles,
    backgroundColor: "#18181b",
  }),
  indicatorContainer: (styles, { data }) => ({
    ...styles,
    color: "#ffffff",
  }),

}


export const semesterStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    background: "#000000",
    borderColor: '#18181b',
    paddingLeft: "4px",
    color: 'white',
    ':hover': {
      borderColor: '#18181b'
    },
    ':focus': {
      outline: "none"
    }
  }),
  menuList: styles => ({
    ...styles,
    borderColor: '#18181b',
    background: '#000000'
  }),
  option: (styles, { isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
          ? "#9333ea"
          : isFocused
            ? "#d8b4fe"
            : undefined,
      color: isDisabled
        ? '#ccc'
        : isFocused
          ? "#9333ea"
          : "white",
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? "#9333ea"
            : "#d8b4fe"
          : undefined,
      }
    }
  },
  menu: base => ({
    ...base,
    zIndex: 100,
    color: 'white'
  }),

  multiValue: (styles, { data }) => {
    return {
      ...styles,
      backgroundColor: "#d8b4fe",
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
    ':hover': {
      backgroundColor: "#9333ea",
      color: 'white',
    },
  }),

  input: (styles, { data }) => ({
    ...styles,
    color: "white",
  }),
  indicatorSeparator: (styles, { data }) => ({
    ...styles,
    backgroundColor: "#18181b",
  }),
  indicatorContainer: (styles, { data }) => ({
    ...styles,
    color: "#ffffff",
  }),

}



export const instructorStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    background: "#18181b",
    borderColor: '#18181b',
    paddingLeft: "4px",
    color: 'white',
    ':hover': {
      borderColor: '#393941'
    },
    ':focus': {
      outline: "none"
    }
  }),
  menuList: styles => ({
    ...styles,
    borderColor: '#18181b',
    background: '#0a0a0a'
  }),
  option: (styles, { isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
          ? "#fff"
          : isFocused
            ? "#18181b"
            : undefined,
      color: isDisabled
        ? '#ccc'
        : isFocused
          ? "#fff"
          : "white",
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? "#fff"
            : "#18181b"
          : undefined,
      }
    }
  },
  menu: base => ({
    ...base,
    zIndex: 100,
    color: 'white'
  }),

  multiValue: (styles, { data }) => {
    return {
      ...styles,
      backgroundColor: "#393941"
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: "#fff",
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: "#fff",
    ':hover': {
      backgroundColor: "#393941",
      color: 'white',
    },
  }),

  input: (styles, { data }) => ({
    ...styles,
    color: "white",
  }),
  indicatorSeparator: (styles, { data }) => ({
    ...styles,
    backgroundColor: "#18181b",
  }),
  indicatorContainer: (styles, { data }) => ({
    ...styles,
    color: "#18181b",
  }),

}


export const graphColors = [
  "#87CEFA", "#98FB98", "#FFA07A", "#FFE4B5", "#F0E68C", "#FF6347", "#FFD700", "#B0E0E6", "#00FA9A", "#FF4500", "#BDB76B", "#8FBC8F", "#FF69B4", "#FA8072", "#FFDAB9", "#FFE4E1", "#F0FFF0", "#FFEC8B", "#FFE4C4", "#D2B48C", "#DDA0DD", "#FFD700", "#FFEBCD",
];


export const labels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

export const boilerExamsCourses = ["MA15800", "MA16010", "MA16100", "MA16200", "MA26100", "MA26200", "MA26500", "MA26600", "MA30300", "CS15900", "CS17700", "CS25100", "CHM11500", "ECON25200", "ECE20002", "PHYS17200"];
