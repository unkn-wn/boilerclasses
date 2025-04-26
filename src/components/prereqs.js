import { useRouter } from 'next/router';
import Link from 'next/link';

const Prereqs = ({ course, scheduler = false }) => {
  const router = useRouter();

  const preReqCourseElement = (token, i) => {
    if(token.split(' ').length === 2) {
      const [detailId, concurrent] = token.split(' ');
      const subjectCodeMatch = token.match(/[A-Z]+/);
      const courseNumberMatch = token.match(/\d+/);

      if (!subjectCodeMatch || !courseNumberMatch) {
        return <li><p>Prereq Error! Check Purdue's official prereq report</p></li>;
      }

      const subjectCode = subjectCodeMatch[0];
      const courseNumber = courseNumberMatch[0];

      return <li className='' key={i}>
        <a
          onClick={(e) => {
            if (scheduler) {
              window.open(`https://www.boilerclasses.com/detail/${detailId}`, '_blank');
            } else {
              router.push(`/detail/${detailId}`);
            }
          }}
          className='underline decoration-dotted cursor-pointer hover:text-blue-700 transition-all duration-300 ease-out text-blue-600'
        >
          {subjectCode} {courseNumber}
        </a>
        {concurrent === "True" ? " [may be taken concurrently]" : ""}
      </li>
    } else if (token.split(' ').length == 3) {
      const [subject, number, concurrent] = token.split(' ');
      return `${subject} ${number}${concurrent === "True" ? " [may be taken concurrently]" : ""}`;
    } else {
      return `${"()".includes(token) ? "" : " "}${token}${"()".includes(token) ? "" : " "}`;
    }
  }

  const generatePrereqTree = (tokens) => {

    const stack = [];
    let currentOp = null;
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token === "(") {

        const [group, consumed] = generatePrereqTree(tokens.slice(i + 1));
        stack.push(group);
        
        //Add an offset to remove all the tokens that were consumed in that sublevel
        i += consumed + 2;

      } else if (token === ")") {
        break;
      } else if (token === "and" || token === "or") {
        currentOp = token;
        i++;
      } else {
        stack.push({ type: "course", value: preReqCourseElement(token, i) });
        i++;
      }
    }

    if (stack.length === 1) return [stack[0], i];

    return [
      {
        type: "group",
        op: currentOp ?? "and",
        children: stack,
      },
      i,
    ];
  };

  const renderNode = (node) => {
    // HTML elements were saved directly to the tree for courses
    if (node.type === "course") {
      return node.value;
    }

    return (
      <li>
        {node.op === "and" ? (node.children.length > 2 ? "ALL of:" : "BOTH of:") : "ONE of:"}
        <ul style={{ paddingLeft: "1em" }}>
          {node.children.map((child, i) => (
            renderNode(child)
          ))}
        </ul>
      </li>
    );
  };

  const parsePrereqs = (prereqs) => {
    
    const [tree] = generatePrereqTree(prereqs);

    return (
      <div>
        <ul>{renderNode(tree)}</ul>
      </div>
    );
  };

  try {
    return (
      (course.prereqs && course.prereqs.length > 0 && course.prereqs[0].split(' ')[0] !== router.query.id) && (
        <div className="prerequisites-container">
          {!scheduler && <div className="text-tertiary lg:text-sm text-xs mb-2">Prerequisites:</div>}
          <div className="lg:text-sm text-xs text-tertiary font-medium">
            {parsePrereqs(course.prereqs)}
          </div>
        </div>
      )
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default Prereqs;