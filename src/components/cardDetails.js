import { useEffect, useState } from 'react';

const CardDetails = () => {
  const { itemId } = useParams();
  const [itemDetails, setItemDetails] = useState(null);

  useEffect(() => {
    // Fetch item details based on itemId
    // Update setItemDetails with the fetched data
  }, [itemId]);

  return (
    <div>
      <p>akjsdksldlks</p>
    </div>
  );
};

export default CardDetails;