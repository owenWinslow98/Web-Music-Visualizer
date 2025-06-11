import { useCallback } from 'react';
import { Button, Form, Input, Upload, Image } from 'antd';
import type { UploadChangeParam } from 'antd/lib/upload';
import ImgCrop from 'antd-img-crop';
import { TikTokOutlined, PlusOutlined } from '@ant-design/icons';
import { useFormContext } from '../context/formContext';
import type { FieldType } from '../context/formContext';
import { resizeUrlImageTo1920x1080Base64 } from '../utils';
const SidePanel = () => {
    const { form, resetForm, initialValues } = useFormContext()
    const onMusicUpload = (info: UploadChangeParam) => {
        const { file } = info

        const audioUrl = URL.createObjectURL(file.originFileObj as Blob)
        form.setFieldsValue({
            audioUrl,
            audioName: file.name,
        })
    }

    const onMajorImgUpload = (info: UploadChangeParam) => {
        const { file } = info;
        const rawFile = file.originFileObj as Blob;
      
        const reader = new FileReader();
        reader.readAsDataURL(rawFile);
        reader.onload = () => {
          const base64 = reader.result as string;
          form.setFieldsValue({
            majorImg: base64,
          });
        };
      };

    const onBackgroundImgUpload = async (info: UploadChangeParam) => {
        const { file } = info
        const base64 = await resizeUrlImageTo1920x1080Base64(URL.createObjectURL(file.originFileObj as Blob));
        form.setFieldsValue({
            backgroundImg: base64,
        })
    }
    /**
     * 音频输入框
     * @param props 
     * @returns 
     */
    const AudioFormItemInput = useCallback((props: { value?: string, onChange?: (info: UploadChangeParam) => void }) => {
        return (
            <div className='flex items-center justify-center'>
                <div className='flex-1 text-left mr-4'>
                    <Input value={props.value} disabled></Input>
                </div>
                <Upload showUploadList={false} onChange={props.onChange}>
                    <Button icon={<TikTokOutlined />}>SELECT AUDIO</Button>
                </Upload>
            </div>
        )
    }, []);
    /**
     * 图片输入框
     * @param props 
     * @returns 
     */
    const ImageFormItemInput = useCallback((props: { value?: string, onChange?: (info: UploadChangeParam) => void, listType?: 'picture' | 'picture-circle', cropShape?: 'round' | 'rect', aspect?: number }) => {
        return (
            <div className='flex w-full justify-end items-center'>
                <div className='w-24 h-24 relative'>
                    <ImgCrop rotationSlider cropShape={props.cropShape} aspect={props.aspect}>
                        <Upload name="avatar" showUploadList={false} listType={props.listType} onChange={props.onChange} className='w-full h-full flex items-center justify-center'>
                            <Image wrapperStyle={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }} src={props.value} preview={false} />
                            <div className='absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer'>
                                <PlusOutlined />
                            </div>
                        </Upload>
                    </ImgCrop>
                </div>
            </div>
        )
    }, []);
    return (
        <div className='w-[350px] px-4 bg-[#232323] text-[#fafafa] flex flex-col ml-1'>
            <div className='py-8 text-2xl font-bold'>Web Music Visualizer</div>
            <div className='border-2 border-[#303030] border-solid  rounded-md p-4 flex-1 mb-4'>
                <Form
                    name="basic"
                    form={form}
                    layout="vertical"
                    style={{ maxWidth: 600 }}
                    initialValues={initialValues}
                    autoComplete="off"
                >
                    <Form.Item<FieldType>
                        label="Audio"
                        name="audioName"
                    >
                    <AudioFormItemInput onChange={onMusicUpload} />
                    </Form.Item>
                    <Form.Item<FieldType>
                        label="Author"
                        name="author"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType> label="Song Name" name="songName">
                        <Input />
                    </Form.Item>

                    {/* <Form.Item label="Major Image" name="majorImg">
                        <ImageFormItemInput onChange={onMajorImgUpload} listType='picture' cropShape='round' aspect={1 / 1} />
                    </Form.Item> */}
                    <Form.Item label="Major Image" name="majorImg">
                        <ImageFormItemInput onChange={onMajorImgUpload} listType='picture' cropShape='round' aspect={1 / 1} />
                        
                    </Form.Item>
                    <Form.Item label="Background Image" name="backgroundImg">
                        <ImageFormItemInput onChange={onBackgroundImgUpload} listType='picture' cropShape='rect' aspect={16 / 9} />
                    </Form.Item>
                    <Form.Item label="Audio URL" name="audioUrl" className='hidden'>
                        <Input />
                    </Form.Item>
                </Form>

                <div className='flex justify-end'>
                    <Button className='mr-4' onClick={resetForm}>RESET</Button>
                    <Button color="danger" variant="solid" onClick={() => console.log(form.getFieldsValue())}>EXPORT VIDEO</Button></div>
            </div>
        </div>
    );
};

export default SidePanel;