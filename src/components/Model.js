import * as tfTask from "@tensorflow-models/tasks";
import { useEffect, useRef, useState } from "react";
import tfmodel from "../model/piles.tflite";
import Webcam from "react-webcam";
import { drawRect } from "../js/rectangles";

const Model = () => {
  const [resolution, setResolution] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const webcamRef = useRef();
  const canvasRef = useRef();

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState();
  const [odModel, setOdModel] = useState();

  const style = {
    position: "absolute",
    zIndex: 0,
    ...resolution,
    top: 0,
    left: 0,
  };

  const handleChange = (e) => {
    console.log(e.target.value);
    setDeviceId(e.target.value);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const {
        video,
        video: { videoWidth, videoHeight },
      } = webcamRef.current;
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      net.predict(video).then((res) => {
        const { objects: obj } = res;
        console.log(obj);
        const ctx = canvasRef.current.getContext("2d");
        drawRect(obj, ctx);
      });
    }
  };

  useEffect(() => {
    setResolution({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.innerWidth, window.innerHeight]);

  useEffect(() => {
    let detectInterval;
    if (odModel) {
      detectInterval = setInterval(() => {
        detect(odModel);
      }, 300);
    } else {
      clearInterval(detectInterval);
    }

    return () => {
      clearInterval(detectInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odModel]);

  useEffect(() => {
    tfTask.ObjectDetection.CustomModel.TFLite.load({
      model: tfmodel,
      maxResults: 5,
      scoreThreshold: 0.5,
    }).then((res) => {
      setOdModel(res);
      console.log("model loaded");
    });

    navigator.mediaDevices.enumerateDevices().then((res) => {
      const webcams = res.filter(({ kind }) => kind === "videoinput");
      setDevices(webcams);
      if (!webcams.map((w) => w.deviceId).includes(deviceId)) {
        setDeviceId(webcams[0].deviceId);
      }
    });
  }, []);

  return (
    <div style={style}>
      <p
        className="control"
        style={{ position: "absolute", top: 0, right: 0, zIndex: 20 }}
      >
        <span className="select">
          <select
            onChange={handleChange}
            style={{
              backgroundColor: "transparent",
              color: "cyan",
              border: "solid 2px cyan",
              fontWeight: "bolder",
            }}
          >
            {devices.map((d, i) => (
              <option
                key={i}
                selected={deviceId === d.deviceId}
                value={d.deviceId}
              >
                {d.label.split("(")[0]}
              </option>
            ))}
          </select>
        </span>
      </p>
      <Webcam
        ref={webcamRef}
        style={{ position: "absolute", top: 0 }}
        videoConstraints={{
          deviceId,
          ...resolution,
        }}
      />

      <canvas ref={canvasRef} style={{ position: "absolute", top: 0 }} />
    </div>
  );
};
export default Model;
