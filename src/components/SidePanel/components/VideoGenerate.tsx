import React, { useEffect, useRef } from 'react';
import { Modal, Form, Input, Radio } from 'antd';
import FfmpegHelper from '../ffmpeg-helper';
interface VideoGenerateProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const VideoGenerate: React.FC<VideoGenerateProps> = ({ open, onOpenChange }) => {
    const [form] = Form.useForm();
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleCancel = () => {
        onOpenChange(false);
        form.resetFields();
    };
    useEffect(() => {
        const mainCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
        if (mainCanvas && previewCanvasRef.current) {
            const previewCtx = previewCanvasRef.current.getContext('2d') as CanvasRenderingContext2D;
            previewCtx.drawImage(mainCanvas, 0, 0, 1920, 1080, 0, 0, 960, 540);
        }
    }, [open])
    return (
        <Modal
            title="Export Video"
            open={open}
            footer={null}  // 移除底部按钮
            onCancel={handleCancel}  // 保留关闭功能
            width='1008px'
            styles={{
                content: {
                    backgroundColor: '#232323',
                },
                header: {
                    backgroundColor: '#232323',
                    color: '#fafafa'
                }
            }}
        >
            <div className='w-full h-full'>
                <canvas ref={previewCanvasRef} width={960} height={540}></canvas>
            </div>
            <div className='mt-4'>
                <Form
                    form={form}
                    layout="horizontal"
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    initialValues={{
                        resolution: "1920x1080",
                        fps: 60,
                        useage: "MediaRecorder"
                    }}
                >
                    <Form.Item
                        name="resolution"
                        label="Video Resolution"

                    >
                        <Radio.Group disabled>
                            <Radio value="1920x1080">1920 x 1080</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="fps"
                        label="Frame Rate"
                    >
                        <Input disabled style={{ color: '#fafafa' }} type="number" min={24} max={60} />
                    </Form.Item>
                    <Form.Item
                        name="useage"
                        label="Use"
                    >
                        <Radio.Group disabled>
                            <Radio value="MediaRecorder">MediaRecorder + ffmpeg</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </div>
            <div className='flex justify-end'>
                <FfmpegHelper />
            </div>
        </Modal>
    );
};

export default VideoGenerate;