const Spinner = () => {
    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%', // Take up full height of the parent container
            width: '100%',  // Take up full width of the parent container
            position: 'absolute',
            top: 0,
            left: 0,
        },
        spinner: {
            fontSize: '20px',
            width: '80px',
            height: '80px',
        },
    };
    return (
        <div style={styles.container}>
            <div className="d-flex spinner-border text-dark" role="status" style={styles.spinner}>
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default Spinner;