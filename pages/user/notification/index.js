import classes from './notification.module.css';
import Navbar from "../../../Components/subNavbar/navbar";
import Head from 'next/head';
import DataTable from '../../../Components/DataTabel/DataTabel';
import { useState, useEffect } from 'react';

const columns = [
    { field: 'message', headerName: 'Notification', width: 400 },
    { field: 'date', headerName: 'Date', width: 200 },
    { field: 'status', headerName: 'Status', width: 130 }
];

const Items = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Fetch your notifications here
        // Example:
        // const fetchNotifications = async () => {
        //     const response = await fetch('/api/notifications');
        //     const data = await response.json();
        //     setNotifications(data);
        // };
        // fetchNotifications();

        // For now, using empty array to prevent error
        setNotifications([]);
    }, []);

    return (
        <>
            <Head>
                <title>MedAssist | Notification</title>
            </Head>
            <div className={classes.main_container}>
                <Navbar title="Notification" />
                <div className={classes.notification_tabel}>
                    <DataTable 
                        data={notifications} 
                        col={columns}
                    />
                </div>
            </div>
        </>
    );
};

export default Items;