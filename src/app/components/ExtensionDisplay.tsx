import React from 'react';
import styles from './ExtensionDisplay.module.css';

interface ExtensionDisplayProps {
    data: any;
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("已复制！");
    }).catch(err => {
        console.error("复制失败:", err);
    });
};

const ExtensionDisplay: React.FC<ExtensionDisplayProps> = ({ data }) => {
    return (
        <div className={styles.extensionContainer}>
            {Object.entries(data).map(([section, value]) => (
                <div key={section} className={styles.section}>
                    <h4 className={styles.sectionTitle}>{section}</h4>
                    <div className={styles.sectionContent}>
                        {renderValue(value)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const renderValue = (value: any) => {
    if (typeof value === 'string') {
        return (
            <div className={styles.valueRow}>
                <span className={styles.valueText}>{value}</span>
                <button className={styles.copyButton} onClick={() => copyToClipboard(value)}>复制</button>
            </div>
        );
    } else if (Array.isArray(value)) {
        return (
            <div className={styles.arrayContainer}>
                {value.map((item, index) => (
                    <div key={index} className={styles.valueRow}>
                        {renderValue(item)}
                    </div>
                ))}
            </div>
        );
    } else if (typeof value === 'object' && value !== null) {
        return (
            <div className={styles.objectContainer}>
                {Object.entries(value).map(([key, val]) => (
                    <div key={key} className={styles.valueRow}>
                        <strong>{key}: </strong>
                        <span className={styles.valueText}>
                            {typeof val === 'object' ? JSON.stringify(val) : (val?.toString() ?? '')}
                        </span>
                        <button
                            className={styles.copyButton}
                            onClick={() => copyToClipboard(typeof val === 'object' ? JSON.stringify(val) : (val?.toString() ?? ''))}
                        >
                            复制
                        </button>
                    </div>
                ))}
            </div>
        );
    } else {
        return (
            <div className={styles.valueRow}>
                <span className={styles.valueText}>{value?.toString() ?? ''}</span>
                <button className={styles.copyButton} onClick={() => copyToClipboard(value?.toString() ?? '')}>复制</button>
            </div>
        );
    }
};

export default ExtensionDisplay;