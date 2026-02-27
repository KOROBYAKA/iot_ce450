import { useEffect, useState } from 'react'
import './Styles.scss'
import Axios from 'axios'

const Product = () => {
 const [beverageData, setBeverageData] = useState({price: 2.5, temperature: 25, humidity: 50})
 const [isLoading, setIsLoading] = useState(true)
  const fetchData = async () => {
            try 
            {
                const res = await Axios.get('http://localhost:3000/database/fetchLatestBeveragePrice');

                if (res.data && Object.keys(res.data.beverageData).length !== 0) {
                    setBeverageData(res.data.beverageData);
                }
                setIsLoading(false);

            } 
            catch (err) {
                console.log(err);
                setIsLoading(false);

            }
        };

 useEffect(() => {
        fetchData()        
        setInterval(() => {
            fetchData()
        }, 10000)
        
    }, []);
  return (
    <>
    {isLoading ? "Loading" 
    : 
        <div className='Product'>
            <h2>Dynamic beverage pricing</h2>
            <p>The price of the drink is calculated based on the temperature, humidity and microphone level readings from the arduino </p>
            <img 
            className='Image'
            src='https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi5.walmartimages.com%2Fasr%2Febe17684-42d0-4eb6-b7e7-6a31802118f6.982edd12a4b11fc73d7a645bb87f70d7.jpeg&f=1&nofb=1&ipt=674d58379ba5afdcc56385a5878df4f7f6f637071bb0892978a69bcd5add69ef' />
            <p className='Name'>Coke Zero</p>
            <p className='Price'>Current price: {beverageData.price} eur </p>
            <p className='Price'>Current temperature: {beverageData.temperature}°C </p>
            <p className='Price'>Current humidity: {beverageData.humidity}% </p>
        </div>
    }
    </>
  )
}

export default Product
