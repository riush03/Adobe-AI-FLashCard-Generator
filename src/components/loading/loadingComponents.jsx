import React from "react";
import Spinner from "./spinner.jsx";
import ErrorDisplay from "./errorDisplay.jsx";

export default function LoadingComponents({ error, setError, status }) {

    return (
        <div
            style={{
                height: "80%",
                display: "flex",
                flexDirection: 'column',
                justifyContent: "center",
                alignItems: "center",
                gap: '25px',
            }}
        >
            <ErrorDisplay error={error} setError={setError} />
            {error == "" ? <Spinner status={status} /> : <div style={{ width: 32, height: 32 }}></div>}
        </div>
    );
}