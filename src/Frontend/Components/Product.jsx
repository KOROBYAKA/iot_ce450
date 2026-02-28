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
            src={'./Images/CokeZero.jpg'} />
            <p className='Name'>Coke Zero</p>
            <p className='Price'>Current price: {beverageData.price.toFixed(2)} eur </p>
            <p className='Price'>Current temperature: {beverageData.temperature.toFixed(1)}°C </p>
            <p className='Price'>Current humidity: {Math.round(beverageData.humidity)}% </p>
        </div>
    }
    </>
  )
}

export default Product
